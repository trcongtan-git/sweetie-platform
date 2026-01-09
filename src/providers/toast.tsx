"use client";

import React, { createContext, useContext, ReactNode } from "react";
import {
  showToast,
  toastSuccess,
  toastError,
  toastInfo,
  toastWarning,
  type ToastType,
  type ToastOptions,
} from "@/components/ui/Toast";

interface ToastContextType {
  showToast: (
    message: string,
    type?: ToastType,
    options?: ToastOptions
  ) => void;
  toastSuccess: (message: string, options?: ToastOptions) => void;
  toastError: (message: string, options?: ToastOptions) => void;
  toastInfo: (message: string, options?: ToastOptions) => void;
  toastWarning: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast Provider - Cung cấp toast functions cho toàn bộ app
 * Sử dụng context để dễ dàng access từ bất kỳ component nào
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const contextValue: ToastContextType = {
    showToast,
    toastSuccess,
    toastError,
    toastInfo,
    toastWarning,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

/**
 * Hook để sử dụng toast functions
 * @returns ToastContextType
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};

export default ToastProvider;
