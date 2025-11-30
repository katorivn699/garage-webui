import { create } from "zustand";

type ConfirmDialogState = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmColor?: "primary" | "error" | "warning";
  itemName?: string;
  warningText?: string;
  onConfirm: (() => void) | null;
};

type ConfirmDialogStore = ConfirmDialogState & {
  open: (params: {
    title: string;
    message: string;
    confirmText?: string;
    confirmColor?: "primary" | "error" | "warning";
    itemName?: string;
    warningText?: string;
    onConfirm: () => void;
  }) => void;
  close: () => void;
};

export const useConfirmDialogStore = create<ConfirmDialogStore>((set) => ({
  isOpen: false,
  title: "",
  message: "",
  confirmText: "Confirm",
  confirmColor: "error",
  itemName: undefined,
  warningText: undefined,
  onConfirm: null,
  open: (params) =>
    set({
      isOpen: true,
      title: params.title,
      message: params.message,
      confirmText: params.confirmText || "Confirm",
      confirmColor: params.confirmColor || "error",
      itemName: params.itemName,
      warningText: params.warningText,
      onConfirm: params.onConfirm,
    }),
  close: () =>
    set({
      isOpen: false,
      title: "",
      message: "",
      confirmText: "Confirm",
      confirmColor: "error",
      itemName: undefined,
      warningText: undefined,
      onConfirm: null,
    }),
}));
