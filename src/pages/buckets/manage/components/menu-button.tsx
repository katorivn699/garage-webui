import Button from "@/components/ui/button";
import { EllipsisVertical, Trash } from "lucide-react";
import { Dropdown } from "react-daisyui";
import { useNavigate, useParams } from "react-router-dom";
import { useRemoveBucket } from "../hooks";
import { toast } from "sonner";
import { handleError } from "@/lib/utils";
import { useConfirmDialogStore } from "@/stores/confirm-dialog-store";

const MenuButton = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const openConfirmDialog = useConfirmDialogStore((state) => state.open);

  const removeBucket = useRemoveBucket({
    onSuccess: () => {
      toast.success("Bucket removed!");
      navigate("/buckets", { replace: true });
    },
    onError: handleError,
  });

  const onRemove = () => {
    openConfirmDialog({
      title: "Remove Bucket",
      message: "Are you sure you want to remove this bucket? All data in this bucket will be permanently deleted.",
      confirmText: "Remove Bucket",
      confirmColor: "error",
      itemName: id,
      warningText: "This action cannot be undone.",
      onConfirm: () => {
        removeBucket.mutate(id!);
      },
    });
  };

  return (
    <Dropdown end>
      <Dropdown.Toggle button={false}>
        <Button icon={EllipsisVertical} color="ghost" />
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item onClick={onRemove} className="bg-error/10 text-error">
          <Trash /> Remove
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default MenuButton;
