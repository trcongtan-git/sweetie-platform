"use client";

import React, { useState, useRef } from "react";
import {
  UploadOutlined,
  DeleteOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { Button, message } from "antd";

interface FileUploadProps {
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  onFilesChange?: (files: File[]) => void;
  initialFiles?: File[];
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  maxFiles = 3,
  maxSize = 10, // 10MB default
  acceptedTypes = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".txt",
    ".png",
    ".jpg",
    ".jpeg",
  ],
  onFilesChange,
  initialFiles = [],
  disabled = false,
}) => {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    if (onFilesChange) {
      onFilesChange(newFiles);
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      message.error(
        `File "${file.name}" vượt quá kích thước cho phép (${maxSize}MB)`
      );
      return false;
    }

    // Check file type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      message.error(
        `File "${
          file.name
        }" không được hỗ trợ. Chỉ chấp nhận: ${acceptedTypes.join(", ")}`
      );
      return false;
    }

    return true;
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: File[] = [];
    const currentFileCount = files.length;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      if (currentFileCount + newFiles.length >= maxFiles) {
        message.warning(`Chỉ được phép tải lên tối đa ${maxFiles} file`);
        break;
      }

      if (validateFile(file)) {
        newFiles.push(file);
      }
    }

    if (newFiles.length > 0) {
      handleFilesChange([...files, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    handleFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div>
      {/* Drop Zone */}
      <div
        style={{
          border: `2px dashed ${isDragOver ? "#155eef" : "#d1d5db"}`,
          borderRadius: "8px",
          padding: "24px",
          textAlign: "center",
          backgroundColor: isDragOver ? "#f0f7ff" : "#fafafa",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.3s ease",
          opacity: disabled ? 0.6 : 1,
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
      >
        <UploadOutlined
          style={{
            fontSize: "32px",
            color: isDragOver ? "#155eef" : "#9ca3af",
            marginBottom: "12px",
          }}
        />
        <div
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "8px",
          }}
        >
          {disabled
            ? "Không thể tải file"
            : "Kéo thả file vào đây hoặc click để chọn"}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#9ca3af",
          }}
        >
          Tối đa {maxFiles} file, mỗi file không quá {maxSize}MB
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#9ca3af",
            marginTop: "4px",
          }}
        >
          Định dạng hỗ trợ: {acceptedTypes.join(", ")}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(",")}
        onChange={handleFileInputChange}
        style={{ display: "none" }}
        disabled={disabled}
      />

      {/* File List */}
      {files.length > 0 && (
        <div
          style={{
            marginTop: "16px",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            backgroundColor: "#fff",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #e5e7eb",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
              backgroundColor: "#f9fafb",
            }}
          >
            File đã chọn ({files.length}/{maxFiles})
          </div>
          {files.map((file, index) => (
            <div
              key={index}
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom:
                  index < files.length - 1 ? "1px solid #f3f4f6" : "none",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FileOutlined style={{ color: "#6b7280" }} />
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#374151",
                      fontWeight: 500,
                    }}
                  >
                    {file.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                    }}
                  >
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => removeFile(index)}
                disabled={disabled}
                style={{
                  color: "#dc2626",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#fef2f2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
