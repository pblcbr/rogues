"use client";

import { create } from "zustand";

type AddWorkspaceModalState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const useAddWorkspaceModalStore = create<AddWorkspaceModalState>(
  (set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
  })
);
