"use client";

import React, { useCallback } from "react";
import { Modal, Upload, message } from "antd";
import type { UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";

const { Dragger } = Upload;

export interface PDFUploadModalProps {
  open: boolean;
  onClose: () => void;
  onFileSelected: (file: File) => Promise<void>;
}

const PDFUploadModal: React.FC<PDFUploadModalProps> = ({
  open,
  onClose,
  onFileSelected,
}) => {
  const handleUpload: UploadProps["customRequest"] = useCallback(
    ({ file, onSuccess }) => {
      const f = file as File;
      if (f.type !== "application/pdf") {
        message.error("Chỉ chấp nhận file PDF");
        return;
      }
      onFileSelected(f).then(() => {
        onSuccess?.(f);
      });
    },
    [onFileSelected]
  );

  return (
    <Modal
      title="Chọn file PDF"
      open={open}
      onCancel={onClose}
      width={560}
      footer={null}
      destroyOnClose
    >
      <Dragger
        name="pdf"
        multiple={false}
        accept=".pdf,application/pdf"
        customRequest={handleUpload}
        showUploadList={false}
        maxCount={1}
        style={{ padding: "48px 24px" }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ fontSize: 48, color: "#1677ff" }} />
        </p>
        <p className="ant-upload-text">
          Kéo thả file PDF vào đây hoặc nhấn để chọn
        </p>
        <p className="ant-upload-hint">Không giới hạn dung lượng file</p>
      </Dragger>
    </Modal>
  );
};

export default PDFUploadModal;
