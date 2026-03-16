"use client";

import React, { useCallback, useState } from "react";
import { Button, Checkbox, Space } from "antd";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  DownloadOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { ContentLayout } from "@/components/layouts";
import PDFPagePreview from "./PDFPagePreview";
import { saveAs } from "file-saver";
import { message } from "antd";

export interface PDFCutContentProps {
  fileName: string;
  pageCount: number;
  selectedPages: Set<number>;
  isExporting: boolean;
  error: string | null;
  pdfJsDocument: PDFDocumentProxy | null;
  onReset: () => void;
  onTogglePage: (pageNum: number) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onExport: () => Promise<void>;
}

const PDFCutContent: React.FC<PDFCutContentProps> = ({
  fileName,
  pageCount,
  selectedPages,
  isExporting,
  pdfJsDocument,
  onReset,
  onTogglePage,
  onSelectAll,
  onSelectNone,
  onExport,
}) => {
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const handleExport = useCallback(async () => {
    await onExport();
  }, [onExport]);

  const pagesToShow = showOnlySelected
    ? Array.from(selectedPages).sort((a, b) => a - b)
    : Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <ContentLayout
      actions={
        <Space direction="vertical" align="end" size={8}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={onReset}>
              Chọn file khác
            </Button>
            <Button onClick={onSelectAll}>
              Chọn tất cả
            </Button>
            <Button onClick={onSelectNone}>
              Bỏ chọn
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              loading={isExporting}
              disabled={selectedPages.size === 0}
            >
              Xuất PDF ({selectedPages.size} trang)
            </Button>
          </Space>
          <Checkbox
            checked={showOnlySelected}
            onChange={(e) => setShowOnlySelected(e.target.checked)}
          >
            Chỉ hiển thị trang đã chọn để preview nhanh
          </Checkbox>
        </Space>
      }
    >
      <p style={{ marginBottom: 16, color: "#64748b", fontSize: 13 }}>
        Tổng {pageCount} trang. Chọn các trang cần xuất.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 16,
        }}
      >
        {pdfJsDocument &&
          pagesToShow.map((num) => (
            <PDFPagePreview
              key={num}
              pdfDocument={pdfJsDocument}
              pageNumber={num}
              isSelected={selectedPages.has(num)}
              onTogglePage={onTogglePage}
            />
          ))}
      </div>
    </ContentLayout>
  );
};

export default PDFCutContent;
