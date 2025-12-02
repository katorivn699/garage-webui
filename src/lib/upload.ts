import { API_URL } from "./api";

// Use 50MB chunks to stay under Cloudflare's 100MB limit per request
const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB per chunk
const MIN_MULTIPART_SIZE = 50 * 1024 * 1024; // Use multipart for files > 50MB
const MAX_CONCURRENT_UPLOADS = 3; // Upload 3 parts at a time
const MAX_RETRIES = 3; // Retry failed parts up to 3 times
const UPLOAD_TIMEOUT = 5 * 60 * 1000; // 5 minutes timeout per part

type UploadPart = {
  etag: string;
  partNumber: number;
};

type MultipartUploadOptions = {
  onProgress?: (progress: number) => void;
  onChunkProgress?: (chunkIndex: number, chunkProgress: number) => void;
};

/**
 * Upload a file using multipart upload (chunking) with parallel uploads
 */
export async function uploadFileMultipart(
  bucket: string,
  key: string,
  file: File,
  options?: MultipartUploadOptions
): Promise<void> {
  const contentType = file.type || "application/octet-stream";
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  try {
    // Step 1: Create multipart upload
    const createRes = await fetch(
      `${API_URL}/multipart/${bucket}/${key}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType }),
      }
    );

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`Failed to create multipart upload: ${errorText}`);
    }

    const { uploadId } = await createRes.json();

    // Step 2: Upload parts in parallel with concurrency limit
    const parts: UploadPart[] = [];
    const chunkProgress: Record<number, number> = {};
    let uploadedBytes = 0;

    // Create upload tasks for all chunks
    const uploadTasks = Array.from({ length: totalChunks }, (_, i) => ({
      index: i,
      start: i * CHUNK_SIZE,
      end: Math.min((i + 1) * CHUNK_SIZE, file.size),
      partNumber: i + 1,
    }));

    // Upload chunks with concurrency control
    await uploadWithConcurrency(
      uploadTasks,
      MAX_CONCURRENT_UPLOADS,
      async (task) => {
        const chunk = file.slice(task.start, task.end);
        
        // Upload chunk with retry mechanism
        const { etag } = await uploadChunkWithRetry(
          bucket,
          key,
          uploadId,
          task.partNumber,
          chunk,
          (progress) => {
            chunkProgress[task.index] = progress;

            // Calculate overall progress
            const completedBytes = Object.entries(chunkProgress).reduce(
              (acc, [idx, prog]) => {
                const chunkIdx = parseInt(idx);
                const chunkStart = chunkIdx * CHUNK_SIZE;
                const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, file.size);
                const chunkSize = chunkEnd - chunkStart;
                return acc + (chunkSize * prog) / 100;
              },
              0
            );

            const totalProgress = (completedBytes / file.size) * 100;
            options?.onProgress?.(totalProgress);

            if (options?.onChunkProgress) {
              options.onChunkProgress(task.index, progress);
            }
          }
        );

        parts.push({ etag, partNumber: task.partNumber });
      }
    );

    // Sort parts by part number (important for S3 multipart completion)
    parts.sort((a, b) => a.partNumber - b.partNumber);

    // Step 3: Complete multipart upload
    const completeRes = await fetch(
      `${API_URL}/multipart/complete/${bucket}/${key}?uploadId=${uploadId}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parts }),
      }
    );

    if (!completeRes.ok) {
      throw new Error("Failed to complete multipart upload");
    }

    options?.onProgress?.(100);
  } catch (error) {
    console.error("Multipart upload failed:", error);
    throw error;
  }
}

/**
 * Upload multiple tasks with concurrency limit
 */
async function uploadWithConcurrency<T>(
  tasks: T[],
  concurrency: number,
  handler: (task: T) => Promise<void>
): Promise<void> {
  const results: Promise<void>[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const promise = handler(task).then(() => {
      executing.splice(executing.indexOf(promise), 1);
    });

    results.push(promise);
    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(results);
}

/**
 * Upload chunk with retry mechanism
 */
async function uploadChunkWithRetry(
  bucket: string,
  key: string,
  uploadId: string,
  partNumber: number,
  chunk: Blob,
  onProgress?: (progress: number) => void,
  retryCount: number = 0
): Promise<{ etag: string }> {
  try {
    return await uploadChunk(
      bucket,
      key,
      uploadId,
      partNumber,
      chunk,
      onProgress
    );
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.warn(
        `Retry ${retryCount + 1}/${MAX_RETRIES} for part ${partNumber}`,
        error
      );
      // Exponential backoff: 1s, 2s, 4s
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retryCount) * 1000)
      );
      return uploadChunkWithRetry(
        bucket,
        key,
        uploadId,
        partNumber,
        chunk,
        onProgress,
        retryCount + 1
      );
    }
    throw error;
  }
}

/**
 * Upload a single chunk with timeout
 */
function uploadChunk(
  bucket: string,
  key: string,
  uploadId: string,
  partNumber: number,
  chunk: Blob,
  onProgress?: (progress: number) => void
): Promise<{ etag: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${API_URL}/multipart/${bucket}/${key}?uploadId=${uploadId}&partNumber=${partNumber}`;

    // Set timeout for the request
    xhr.timeout = UPLOAD_TIMEOUT;

    xhr.open("PUT", url);
    xhr.withCredentials = true;

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        onProgress?.(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({ etag: response.etag });
        } catch {
          reject(new Error("Invalid response from server"));
        }
      } else {
        reject(new Error(`Failed to upload chunk: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error while uploading chunk"));
    });

    xhr.addEventListener("timeout", () => {
      reject(new Error(`Upload timeout after ${UPLOAD_TIMEOUT / 1000}s`));
    });

    xhr.send(chunk);
  });
}

/**
 * Upload file with automatic selection between regular and multipart upload
 */
export async function uploadFile(
  bucket: string,
  key: string,
  file: File,
  options?: MultipartUploadOptions
): Promise<void> {
  // Use multipart upload for large files
  if (file.size >= MIN_MULTIPART_SIZE) {
    return uploadFileMultipart(bucket, key, file, options);
  }

  // Regular upload for small files
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `${API_URL}/browse/${bucket}/${key}`);
    xhr.withCredentials = true;

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && options?.onProgress) {
        const progress = (e.loaded / e.total) * 100;
        options.onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        options?.onProgress?.(100);
        resolve();
      } else {
        reject(new Error(xhr.responseText || "Upload failed"));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error"));
    });

    xhr.send(formData);
  });
}
