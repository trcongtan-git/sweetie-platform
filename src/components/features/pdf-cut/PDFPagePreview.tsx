"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Checkbox, Spin } from "antd";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { renderPdfPageToDataUrl } from "@/features/pdf-cut/hooks/usePdfCut";

interface PDFPagePreviewProps {
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
  isSelected: boolean;
  onTogglePage: (pageNum: number) => void;
}

const PDFPagePreview: React.FC<PDFPagePreviewProps> = ({
  pdfDocument,
  pageNumber,
  isSelected,
  onTogglePage,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStartedLoad = useRef(false);

  useEffect(() => {
    let cancelled = false;
    hasStartedLoad.current = false;
    const el = containerRef.current;
    if (!el) return;

    const runLoad = () => {
      const load = async () => {
        try {
          const dataUrl = await renderPdfPageToDataUrl(pdfDocument, pageNumber, 1.2);
          if (!cancelled) {
            setPreviewUrl(dataUrl);
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Không thể tải preview");
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };
      load();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || hasStartedLoad.current) return;
        hasStartedLoad.current = true;

        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(runLoad, { timeout: 200 });
        } else {
          setTimeout(runLoad, 0);
        }
      },
      { rootMargin: "100px", threshold: 0.01 }
    );

    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [pdfDocument, pageNumber]);

  const handleClick = useCallback(() => {
    onTogglePage(pageNumber);
  }, [onTogglePage, pageNumber]);

  return (
    <div
      ref={containerRef}
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
          <img
            src={previewUrl}
            alt={`Trang ${pageNumber}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
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
