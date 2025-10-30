"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toast Component
 * Modern notification system for user feedback
 */

interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
  onClose: () => void;
}

export function Toast({
  id,
  title,
  description,
  variant = "default",
  onClose,
}: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const variantStyles = {
    default: "bg-white border-gray-200",
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-amber-50 border-amber-200",
  };

  const variantTextStyles = {
    default: "text-gray-900",
    success: "text-green-900",
    error: "text-red-900",
    warning: "text-amber-900",
  };

  const variantDescriptionStyles = {
    default: "text-gray-600",
    success: "text-green-700",
    error: "text-red-700",
    warning: "text-amber-700",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all",
        variantStyles[variant]
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-1">
            {title && (
              <p
                className={cn(
                  "text-sm font-semibold",
                  variantTextStyles[variant]
                )}
              >
                {title}
              </p>
            )}
            {description && (
              <p
                className={cn(
                  "mt-1 text-sm",
                  variantDescriptionStyles[variant]
                )}
              >
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 inline-flex flex-shrink-0 rounded-md p-1 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastProps[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-50 flex w-full flex-col items-end space-y-4 p-6 sm:p-8">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}
