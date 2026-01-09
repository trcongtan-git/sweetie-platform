"use client";

import React, { useState, useRef } from "react";
import { Upload, Avatar, Button, message } from "antd";
import { UserOutlined, UploadOutlined, LoadingOutlined } from "@ant-design/icons";
import type { UploadProps, UploadFile } from "antd/es/upload";

interface AvatarUploadProps {
  value?: string | null;
  onChange?: (url: string | null) => void;
  onUpload?: (file: File) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  size?: number; // Avatar size in pixels (default: 120)
  showBorder?: boolean; // Show white border around avatar (default: false)
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  value,
  onChange,
  onUpload,
  loading = false,
  disabled = false,
  size = 120,
  showBorder = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      message.error("Kích thước file vượt quá 5MB");
      return false;
    }

    // Check file type
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedMimeTypes.includes(file.type)) {
      message.error(
        "File không phải là ảnh hợp lệ. Chỉ chấp nhận: JPG, JPEG, PNG, GIF, WebP"
      );
      return false;
    }

    return true;
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) {
      return false;
    }

    if (onUpload) {
      setUploading(true);
      try {
        await onUpload(file);
      } catch (error) {
        // Error handling is done by parent via toast
        console.error("Upload error:", error);
      } finally {
        setUploading(false);
      }
    } else if (onChange) {
      // If no onUpload provided, just create a preview URL
      const previewUrl = URL.createObjectURL(file);
      onChange(previewUrl);
    }

    return false; // Prevent default upload
  };

  const uploadProps: UploadProps = {
    name: "file",
    accept: "image/jpeg,image/jpg,image/png,image/gif,image/webp",
    maxCount: 1,
    showUploadList: false,
    beforeUpload: (file) => {
      handleFileSelect(file);
      return false; // Prevent default upload
    },
    disabled: disabled || loading || uploading,
  };

  const handleClick = () => {
    if (!disabled && !loading && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <Upload {...uploadProps}>
        <div
          onClick={handleClick}
          style={{
            cursor: disabled || loading || uploading ? "not-allowed" : "pointer",
            display: "inline-block",
            position: "relative",
            border: showBorder ? "4px solid #ffffff" : "none",
            borderRadius: "50%",
            padding: showBorder ? "0" : "0",
            backgroundColor: showBorder ? "#ffffff" : "transparent",
          }}
        >
          <Avatar
            size={size}
            src={value || undefined}
            icon={!value ? <UserOutlined /> : undefined}
            style={{
              opacity: disabled || loading || uploading ? 0.6 : 1,
            }}
          />
          {(loading || uploading) && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 10,
              }}
            >
              <LoadingOutlined style={{ fontSize: 24, color: "#155eef" }} spin />
            </div>
          )}
          {/* Edit Icon Overlay - Facebook Style */}
          {!disabled && !loading && !uploading && (
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                right: "8px",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#155eef",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                border: "2px solid #ffffff",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <UploadOutlined style={{ color: "#ffffff", fontSize: "16px" }} />
            </div>
          )}
        </div>
      </Upload>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
          // Reset input to allow selecting the same file again
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
      />
    </div>
  );
};

export default AvatarUpload;

