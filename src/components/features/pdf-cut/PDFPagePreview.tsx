"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button, Checkbox, Image, Spin } from "antd";
import { ZoomInOutlined } from "@ant-design/icons";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { renderPdfPageToDataUrl } from "@/features/pdf-cut/hooks/usePdfCut";

interface PDFPagePreviewProps {
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
  isSelected: boolean;
  onTogglePage: (pageNum: number) => void;
  shouldLoad: boolean;
  onLoadComplete: () => void;
  cachedPreviewUrl?: string | null;
  onPreviewLoaded?: (pageNum: number, dataUrl: string) => void;
}

const PDFPagePreview: React.FC<PDFPagePreviewProps> = ({
  pdfDocument,
  pageNumber,
  isSelected,
  onTogglePage,
  shouldLoad,
  onLoadComplete,
  cachedPreviewUrl,
  onPreviewLoaded,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(cachedPreviewUrl ?? null);
  const [loading, setLoading] = useState(!cachedPreviewUrl);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);

  useEffect(() => {
    if (cachedPreviewUrl) {
      setPreviewUrl(cachedPreviewUrl);
      setLoading(false);
      if (shouldLoad) {
        onLoadComplete();
      }
      return;
    }
  }, [cachedPreviewUrl, shouldLoad, onLoadComplete]);

  useEffect(() => {
    if (!shouldLoad || cachedPreviewUrl) return;

    let cancelled = false;

    const load = async () => {
      try {
        const dataUrl = await renderPdfPageToDataUrl(pdfDocument, pageNumber, 1.2);
        if (!cancelled) {
          setPreviewUrl(dataUrl);
          onPreviewLoaded?.(pageNumber, dataUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không thể tải preview");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          onLoadComplete();
        }
      }
    };

    const delay = pageNumber === 1 ? 100 : 0;
    const id = setTimeout(() => {
      if (!cancelled) {
        load();
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [pdfDocument, pageNumber, shouldLoad, onLoadComplete, cachedPreviewUrl, onPreviewLoaded]);

  const handleClick = useCallback(() => {
    onTogglePage(pageNumber);
  }, [onTogglePage, pageNumber]);

  return (
    <div
      style={{
        border: `2px solid ${isSelected ? "#1677ff" : "#e5e7eb"}`,
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "#f9fafb",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onClick={handleClick}
    >
      <div
        style={{
          aspectRatio: "210/297",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 180,
          position: "relative",
        }}
      >
        {loading && (
          <Spin size="large" style={{ position: "absolute" }} />
        )}
        {error && (
          <div
            style={{
              padding: 16,
              color: "#ef4444",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
        {previewUrl && !loading && (
          <>
            <Button
              type="text"
              size="small"
              icon={<ZoomInOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setImagePreviewVisible(true);
              }}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 10,
                color: "rgba(0,0,0,0.65)",
              }}
            />
            <Image
              src={previewUrl}
              style={{ display: "none" }}
              preview={{
                visible: imagePreviewVisible,
                onVisibleChange: (v) => setImagePreviewVisible(v),
              }}
            />
            <img
              src={previewUrl}
              alt={`Trang ${pageNumber}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </>
        )}
      </div>
      <div
        style={{
          padding: "8px 12px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: 8,
          backgroundColor: "#fff",
        }}
      >
        <Checkbox checked={isSelected} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Trang {pageNumber}</span>
      </div>
    </div>
  );
};

export default React.memo(PDFPagePreview);
