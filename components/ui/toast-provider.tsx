"use client";

import { ToastContainer } from "./toast";
import { useToastStore } from "@/lib/hooks/use-toast";

/**
 * Toast Provider Component
 * Renders toast notifications globally
 */
export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  return (
    <ToastContainer
      toasts={toasts.map((toast) => ({
        ...toast,
        onClose: () => removeToast(toast.id),
      }))}
    />
  );
}
