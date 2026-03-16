"use client";

import React, { useCallback } from "react";
import { Modal, Upload, Button, message, Space } from "antd";
import type { UploadProps } from "antd";
import { InboxOutlined, DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { usePdfCut } from "@/features/pdf-cut/hooks/usePdfCut";
import PDFPagePreview from "./PDFPagePreview";
import { saveAs } from "file-saver";

const { Dragger } = Upload;

export interface PDFCutModalProps {
  open: boolean;
  onClose: () => void;
}

const PDFCutModal: React.FC<PDFCutModalProps> = ({ open, onClose }) => {
  const {
    pdfData,
    pdfJsDocument,
    fileName,
    pageCount,
    selectedPages,
    isExporting,
    error,
    loadPdf,
    reset,
    togglePage,
    selectAll,
    selectNone,
    exportSelectedPages,
    setError,
  } = usePdfCut();

  const handleUpload: UploadProps["customRequest"] = useCallback(
    ({ file, onSuccess }) => {
      const f = file as File;
      if (f.type !== "application/pdf") {
        message.error("Chỉ chấp nhận file PDF");
        setError("Chỉ chấp nhận file PDF");
        return;
      }
      loadPdf(f).then(() => {
        onSuccess?.(f);
      });
    },
    [loadPdf, setError]
  );

  const handleExport = useCallback(async () => {
    const blob = await exportSelectedPages();
    if (blob) {
      saveAs(blob, `${fileName || "cut"}_selected.pdf`);
      message.success("Xuất file thành công");
    } else if (error) {
      message.error(error);
    }
  }, [exportSelectedPages, fileName, error]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  return (
    <Modal
      title="Cắt PDF"
      open={open}
      onCancel={handleClose}
      width={900}
      footer={null}
      destroyOnClose
      styles={{
        body: { maxHeight: "75vh", overflowY: "auto" },
      }}
    >
      {!pdfData ? (
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
          <p className="ant-upload-hint">
            Không giới hạn dung lượng file
          </p>
        </Dragger>
      ) : (
        <>
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={reset}
              >
                Chọn file khác
              </Button>
              <Button size="small" onClick={selectAll}>
                Chọn tất cả
              </Button>
              <Button size="small" onClick={selectNone}>
                Bỏ chọn
              </Button>
            </Space>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              loading={isExporting}
              disabled={selectedPages.size === 0}
            >
              Xuất PDF ({selectedPages.size} trang)
            </Button>
          </div>

          <p style={{ marginBottom: 12, color: "#64748b", fontSize: 13 }}>
            File: {fileName}.pdf - Tổng {pageCount} trang. Chọn các trang cần xuất.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 16,
            }}
          >
            {pdfJsDocument &&
              Array.from({ length: pageCount }, (_, i) => i + 1).map((num) => (
                <PDFPagePreview
                  key={num}
                  pdfDocument={pdfJsDocument}
                  pageNumber={num}
                  isSelected={selectedPages.has(num)}
                  onToggle={() => togglePage(num)}
                />
              ))}
          </div>
        </>
      )}
    </Modal>
  );
};

export default PDFCutModal;
