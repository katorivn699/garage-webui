import { Modal } from "react-daisyui";
import Button from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useConfirmDialogStore } from "@/stores/confirm-dialog-store";

const ConfirmDialog = () => {
  const {
    isOpen,
    title,
    message,
    confirmText,
    confirmColor,
    itemName,
    warningText,
    onConfirm,
    close,
  } = useConfirmDialogStore();

  const handleConfirm = () => {
    onConfirm?.();
    close();
  };

  return (
    <Modal open={isOpen} className="max-w-md">
      <Modal.Header className="flex items-center gap-3 pb-2">
        <div
          className={`p-2 rounded-lg ${
            confirmColor === "error"
              ? "bg-error/20"
              : confirmColor === "warning"
              ? "bg-warning/20"
              : "bg-primary/20"
          }`}
        >
          <AlertTriangle
            size={20}
            className={
              confirmColor === "error"
                ? "text-error"
                : confirmColor === "warning"
                ? "text-warning"
                : "text-primary"
            }
          />
        </div>
        <span className="font-semibold">{title}</span>
      </Modal.Header>

      <Modal.Body className="space-y-4">
        <p className="text-base-content/80">{message}</p>

        {itemName && (
          <div className="bg-base-200 rounded-lg p-3 border border-base-300/50">
            <p className="text-sm font-medium break-all">{itemName}</p>
          </div>
        )}

        {warningText && (
          <p
            className={`text-sm font-medium ${
              confirmColor === "error"
                ? "text-error"
                : confirmColor === "warning"
                ? "text-warning"
                : "text-primary"
            }`}
          >
            {warningText}
          </p>
        )}
      </Modal.Body>

      <Modal.Actions>
        <Button onClick={close} color="ghost">
          Cancel
        </Button>
        <Button onClick={handleConfirm} color={confirmColor}>
          {confirmText}
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default ConfirmDialog;
