import { Modal } from "react-daisyui";
import Button from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useDeleteDialogStore } from "./delete-dialog-store";

const DeleteDialog = () => {
  const { isOpen, objectName, isDirectory, onConfirm, close } =
    useDeleteDialogStore();

  const handleConfirm = () => {
    onConfirm?.();
    close();
  };

  return (
    <Modal open={isOpen} className="max-w-md">
      <Modal.Header className="flex items-center gap-3 pb-2">
        <div className="p-2 rounded-lg bg-error/20">
          <AlertTriangle size={20} className="text-error" />
        </div>
        <span className="font-semibold">Delete {isDirectory ? "Folder" : "File"}</span>
      </Modal.Header>

      <Modal.Body className="space-y-4">
        <p className="text-base-content/80">
          Are you sure you want to delete{" "}
          {isDirectory ? "this folder and all its contents" : "this file"}?
        </p>

        <div className="bg-base-200 rounded-lg p-3 border border-base-300/50">
          <p className="text-sm font-medium break-all">{objectName}</p>
          {isDirectory && (
            <p className="text-xs text-warning mt-2 flex items-center gap-1">
              <AlertTriangle size={12} />
              All files and subfolders will be permanently deleted
            </p>
          )}
        </div>

        <p className="text-sm text-error font-medium">
          This action cannot be undone.
        </p>
      </Modal.Body>

      <Modal.Actions>
        <Button onClick={close} color="ghost">
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="error" icon={Trash2}>
          Delete
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default DeleteDialog;
