import { API_URL } from "./api";

// Use 50MB chunks to stay under Cloudflare's 100MB limit per request
const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB per chunk
const MIN_MULTIPART_SIZE = 50 * 1024 * 1024; // Use multipart for files > 50MB

type UploadPart = {
  etag: string;
  partNumber: number;
};

type MultipartUploadOptions = {
  onProgress?: (progress: number) => void;
  onChunkProgress?: (chunkIndex: number, chunkProgress: number) => void;
};

/**
 * Upload a file using multipart upload (chunking)
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

    // Step 2: Upload parts
    const parts: UploadPart[] = [];
    let uploadedBytes = 0;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const partNumber = i + 1;

      // Upload chunk with XMLHttpRequest for progress tracking
      const { etag } = await uploadChunk(
        bucket,
        key,
        uploadId,
        partNumber,
        chunk,
        (chunkProgress) => {
          if (options?.onChunkProgress) {
            options.onChunkProgress(i, chunkProgress);
          }

          // Calculate overall progress
          const currentChunkBytes = (chunk.size * chunkProgress) / 100;
          const totalProgress =
            ((uploadedBytes + currentChunkBytes) / file.size) * 100;
          options?.onProgress?.(totalProgress);
        }
      );

      uploadedBytes += chunk.size;
      parts.push({ etag, partNumber });

      // Update progress after chunk completion
      const overallProgress = (uploadedBytes / file.size) * 100;
      options?.onProgress?.(overallProgress);
    }

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
 * Upload a single chunk
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
