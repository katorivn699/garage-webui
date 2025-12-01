import { FolderPlus, UploadIcon } from "lucide-react";
import Button from "@/components/ui/button";
import { usePutObject } from "./hooks";
import { toast } from "sonner";
import { handleError } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useBucketContext } from "../context";
import { useDisclosure } from "@/hooks/useDisclosure";
import { Modal } from "react-daisyui";
import { createFolderSchema, CreateFolderSchema } from "./schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputField } from "@/components/ui/input";
import { useEffect, useState } from "react";
import UploadProgressDialog, { UploadFile } from "./upload-progress-dialog";
import { uploadFile } from "@/lib/upload";

type Props = {
  prefix: string;
};

const Actions = ({ prefix }: Props) => {
  const { bucketName } = useBucketContext();
  const queryClient = useQueryClient();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["browse", bucketName] });
  };

  const handleCloseDialog = () => {
    onClose();
    // Clear upload files after dialog is closed
    setTimeout(() => setUploadFiles([]), 300);
  };

  const onUploadFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;

    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files?.length) {
        return;
      }

      if (files.length > 20) {
        toast.error("You can only upload up to 20 files at a time");
        return;
      }

      // Initialize upload files
      const initialFiles: UploadFile[] = Array.from(files).map((file) => ({
        name: file.name,
        size: file.size,
        progress: 0,
        status: "pending",
      }));

      setUploadFiles(initialFiles);
      onOpen();

      // Start uploading files with parallel uploads (max 3 concurrent)
      uploadFilesParallel(Array.from(files), initialFiles);
    };

    input.click();
    input.remove();
  };

  const uploadFilesParallel = async (
    files: File[],
    _uploadFileStates: UploadFile[]
  ) => {
    const MAX_CONCURRENT = 3; // Upload 3 files at a time
    const activeUploads = new Set<Promise<void>>();

    const uploadSingleFile = async (file: File, index: number) => {
      const key = prefix + file.name;

      // Update status to uploading
      setUploadFiles((prev) =>
        prev.map((f, idx) =>
          idx === index ? { ...f, status: "uploading" } : f
        )
      );

      try {
        // Use uploadFile function which automatically handles multipart for large files
        await uploadFile(bucketName, key, file, {
          onProgress: (progress) => {
            setUploadFiles((prev) =>
              prev.map((f, idx) =>
                idx === index ? { ...f, progress } : f
              )
            );
          },
        });

        // Mark as success
        setUploadFiles((prev) =>
          prev.map((f, idx) =>
            idx === index ? { ...f, status: "success", progress: 100 } : f
          )
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Upload failed";
        setUploadFiles((prev) =>
          prev.map((f, idx) =>
            idx === index ? { ...f, status: "error", error: errorMsg } : f
          )
        );
        console.error(`Failed to upload ${file.name}:`, error);
      }
    };

    // Process files with concurrency limit
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Wait if we've reached max concurrent uploads
      if (activeUploads.size >= MAX_CONCURRENT) {
        await Promise.race(activeUploads);
      }

      // Start upload
      const uploadPromise = uploadSingleFile(file, i).finally(() => {
        activeUploads.delete(uploadPromise);
      });
      
      activeUploads.add(uploadPromise);
    }

    // Wait for all remaining uploads to complete
    await Promise.all(activeUploads);

    // All uploads completed
    handleUploadComplete();
  };

  return (
    <>
      <CreateFolderAction prefix={prefix} />
      {/* <Button icon={FilePlus} color="ghost" /> */}
      <Button
        icon={UploadIcon}
        color="ghost"
        title="Upload File"
        onClick={onUploadFile}
      />
      {/* <Button icon={EllipsisVertical} color="ghost" /> */}

      <UploadProgressDialog
        files={uploadFiles}
        isOpen={isOpen}
        onClose={handleCloseDialog}
      />
    </>
  );
};

type CreateFolderActionProps = {
  prefix: string;
};

const CreateFolderAction = ({ prefix }: CreateFolderActionProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { bucketName } = useBucketContext();
  const queryClient = useQueryClient();

  const form = useForm<CreateFolderSchema>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (isOpen) form.setFocus("name");
  }, [isOpen]);

  const createFolder = usePutObject(bucketName, {
    onSuccess: () => {
      toast.success("Folder created!");
      queryClient.invalidateQueries({ queryKey: ["browse", bucketName] });
      onClose();
      form.reset();
    },
    onError: handleError,
  });

  const onSubmit = form.handleSubmit((values) => {
    createFolder.mutate({ key: `${prefix}${values.name}/`, file: null });
  });

  return (
    <>
      <Button
        icon={FolderPlus}
        color="ghost"
        onClick={onOpen}
        title="Create Folder"
      />

      <Modal open={isOpen}>
        <Modal.Header>Create Folder</Modal.Header>

        <Modal.Body>
          <form onSubmit={onSubmit}>
            <InputField form={form} name="name" title="Name" />
          </form>
        </Modal.Body>

        <Modal.Actions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            color="primary"
            onClick={onSubmit}
            disabled={createFolder.isPending}
          >
            Submit
          </Button>
        </Modal.Actions>
      </Modal>
    </>
  );
};

export default Actions;
