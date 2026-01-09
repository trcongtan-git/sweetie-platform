"use client";

import React from "react";
import toast, { Toaster } from "react-hot-toast";
import { CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  duration?: number;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
}

/**
 * Base Toast component với styling theo mẫu frontend-template
 * Hỗ trợ 4 loại: success, error, info, warning
 */
export const showToast = (
  message: string,
  type: ToastType = "info",
  options: ToastOptions = {}
) => {
  const { duration = 4000, position = "top-right" } = options;

  switch (type) {
    case "success":
      toast.success(message, {
        duration,
        position,
        style: {
          background: "#f6ffed",
          border: "1px solid #b7eb8f",
          color: "#389e0d",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: "500",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          padding: "12px 16px",
        },
        icon: <CheckCircle size={20} color="#52c41a" />,
      });
      break;

    case "error":
      toast.error(message, {
        duration,
        position,
        style: {
          background: "#fff2f0",
          border: "1px solid #ffccc7",
          color: "#cf1322",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: "500",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          padding: "12px 16px",
        },
        icon: <XCircle size={20} color="#ff4d4f" />,
      });
      break;

    case "warning":
      toast(message, {
        duration,
        position,
        style: {
          background: "#fffbe6",
          border: "1px solid #ffe58f",
          color: "#d48806",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: "500",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          padding: "12px 16px",
        },
        icon: <AlertTriangle size={20} color="#d48806" />,
      });
      break;

    case "info":
    default:
      toast(message, {
        duration,
        position,
        style: {
          background: "#e6f7ff",
          border: "1px solid #91d5ff",
          color: "#096dd9",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: "500",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          padding: "12px 16px",
        },
        icon: <Info size={20} color="#1890ff" />,
      });
      break;
  }
};

/**
 * Toast Container Component
 * Cần được thêm vào root layout để hiển thị toast
 */
export const ToastContainer: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options cho tất cả toast
        duration: 4000,
        style: {
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: "500",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          padding: "12px 16px",
        },
        // Success toast
        success: {
          style: {
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            color: "#389e0d",
          },
          icon: <CheckCircle size={20} color="#52c41a" />,
        },
        // Error toast
        error: {
          style: {
            background: "#fff2f0",
            border: "1px solid #ffccc7",
            color: "#cf1322",
          },
          icon: <XCircle size={20} color="#ff4d4f" />,
        },
        // Loading toast
        loading: {
          style: {
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            color: "#374151",
          },
        },
      }}
    />
  );
};

/**
 * Convenience functions cho từng loại toast
 */
export const toastSuccess = (message: string, options?: ToastOptions) =>
  showToast(message, "success", options);

export const toastError = (message: string, options?: ToastOptions) =>
  showToast(message, "error", options);

export const toastInfo = (message: string, options?: ToastOptions) =>
  showToast(message, "info", options);

export const toastWarning = (message: string, options?: ToastOptions) =>
  showToast(message, "warning", options);

export default showToast;
