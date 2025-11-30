import { create } from "zustand";

type DeleteDialogState = {
  isOpen: boolean;
  objectName: string;
  isDirectory: boolean;
  onConfirm: (() => void) | null;
};

type DeleteDialogStore = DeleteDialogState & {
  open: (params: {
    objectName: string;
    isDirectory: boolean;
    onConfirm: () => void;
  }) => void;
  close: () => void;
};

export const useDeleteDialogStore = create<DeleteDialogStore>((set) => ({
  isOpen: false,
  objectName: "",
  isDirectory: false,
  onConfirm: null,
  open: ({ objectName, isDirectory, onConfirm }) =>
    set({ isOpen: true, objectName, isDirectory, onConfirm }),
  close: () =>
    set({ isOpen: false, objectName: "", isDirectory: false, onConfirm: null }),
}));
