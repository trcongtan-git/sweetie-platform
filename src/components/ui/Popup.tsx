"use client";

import React, { useEffect } from "react";
import { Modal as AntModal, Button, Typography } from "antd";
import type { ModalProps as AntModalProps } from "antd/es/modal";
import { CloseOutlined } from "@ant-design/icons";

const { Title } = Typography;

export interface PopupProps extends Omit<AntModalProps, "title"> {
  title?: string | React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  open: boolean;
  width?: number | string;
  height?: number | string;
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  destroyOnClose?: boolean;
  footer?: React.ReactNode;
  showFooter?: boolean;
  onOk?: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  loading?: boolean;
  type?: "info" | "success" | "warning" | "error" | "confirm";
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  headerStyle?: React.CSSStyleProperties;
  footerStyle?: React.CSSProperties;
  centered?: boolean;
  zIndex?: number;
}

const Popup: React.FC<PopupProps> = ({
  title,
  children,
  onClose,
  open,
  width = 520,
  height,
  closable = true,
  maskClosable = true,
  keyboard = true,
  destroyOnClose = false,
  footer,
  showFooter = false,
  onOk,
  onCancel,
  okText = "Xác nhận",
  cancelText = "Hủy",
  loading = false,
  type = "info",
  icon,
  description: _description,
  className,
  style,
  bodyStyle,
  headerStyle,
  footerStyle,
  centered = true,
  zIndex = 1000,
  ...restProps
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open && keyboard) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, keyboard, onClose]);

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  // Handle ok
  const handleOk = () => {
    if (onOk) {
      onOk();
    }
  };

  // Get type-specific styles
  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          icon: icon || "✅",
          color: "#52c41a",
          borderColor: "#b7eb8f",
        };
      case "error":
        return {
          icon: icon || "❌",
          color: "#ff4d4f",
          borderColor: "#ffccc7",
        };
      case "warning":
        return {
          icon: icon || "⚠️",
          color: "#faad14",
          borderColor: "#ffe58f",
        };
      case "confirm":
        return {
          icon: icon || "❓",
          color: "#1890ff",
          borderColor: "#91d5ff",
        };
      default:
        return {
          icon: icon || "ℹ️",
          color: "#1890ff",
          borderColor: "#91d5ff",
        };
    }
  };

  const typeStyles = getTypeStyles();

  // Default footer
  const defaultFooter = showFooter ? (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "8px",
        // remove padding and border for compact footer
        padding: 0,
        ...footerStyle,
      }}
    >
      <Button onClick={handleCancel} disabled={loading}>
        {cancelText}
      </Button>
      <Button type="primary" onClick={handleOk} loading={loading}>
        {okText}
      </Button>
    </div>
  ) : null;

  // Custom title without icon and description
  const customTitle = title ? (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 8,
        ...headerStyle,
      }}
    >
      <Title level={4} style={{ margin: 0 }}>
        {title}
      </Title>
      {closable && (
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          style={{ marginLeft: "16px" }}
        />
      )}
    </div>
  ) : undefined;

  return (
    <AntModal
      title={customTitle}
      open={open}
      onCancel={onClose}
      width={width}
      height={height}
      closable={false} // We handle close button in custom title
      maskClosable={maskClosable}
      keyboard={keyboard}
      destroyOnHidden={destroyOnClose}
      footer={footer || defaultFooter}
      centered={centered}
      zIndex={zIndex}
      className={className}
      style={{
        // border removed to eliminate surrounding outline
        ...style,
      }}
      styles={{
        body: {
          margin: 0,
          paddingLeft: 0,
          paddingRight: 0,
          paddingTop: 16,
          paddingBottom: 16,
          ...bodyStyle,
        },
      }}
      {...restProps}
    >
      {children}
    </AntModal>
  );
};

// Convenience methods for different popup types
export const showInfoPopup = (
  title: string,
  content: React.ReactNode,
  options?: Partial<PopupProps>
) => {
  // This would be implemented with a global popup manager
  console.log("Info popup:", title, content, options);
};

export const showSuccessPopup = (
  title: string,
  content: React.ReactNode,
  options?: Partial<PopupProps>
) => {
  console.log("Success popup:", title, content, options);
};

export const showErrorPopup = (
  title: string,
  content: React.ReactNode,
  options?: Partial<PopupProps>
) => {
  console.log("Error popup:", title, content, options);
};

export const showWarningPopup = (
  title: string,
  content: React.ReactNode,
  options?: Partial<PopupProps>
) => {
  console.log("Warning popup:", title, content, options);
};

export const showConfirmPopup = (
  title: string,
  content: React.ReactNode,
  onConfirm: () => void,
  options?: Partial<PopupProps>
) => {
  console.log("Confirm popup:", title, content, onConfirm, options);
};

export default Popup;
