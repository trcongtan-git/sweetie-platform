"use client";

import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
}

export function usePdfCut() {
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfJsDocument, setPdfJsDocument] = useState<PDFDocumentProxy | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [pageCount, setPageCount] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPdf = useCallback(async (file: File) => {
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const count = pdfDoc.getPageCount();

      const bufferForExport = arrayBuffer.slice(0);
      const bufferForPdfJs = arrayBuffer.slice(0);

      const pdfJsDoc = await pdfjsLib.getDocument({ data: bufferForPdfJs }).promise;
      // Warm up page 1 to trigger lazy parse - fixes "stuck loading" on first page
      try {
        const firstPage = await pdfJsDoc.getPage(1);
        firstPage.cleanup?.();
      } catch {
        // Ignore - page 1 will load when preview renders
      }

      setPdfData(bufferForExport);
      setPdfJsDocument(pdfJsDoc);
      setFileName(file.name.replace(/\.pdf$/i, ""));
      setPageCount(count);
      setSelectedPages(new Set());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể đọc file PDF"
      );
    }
  }, []);

  const reset = useCallback(() => {
    setPdfData(null);
    setPdfJsDocument(null);
    setFileName("");
    setPageCount(0);
    setSelectedPages(new Set());
    setError(null);
  }, []);

  const togglePage = useCallback((pageNum: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedPages(
      new Set(Array.from({ length: pageCount }, (_, i) => i + 1))
    );
  }, [pageCount]);

  const selectNone = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  const exportSelectedPages = useCallback(async (): Promise<Blob | null> => {
    if (!pdfData || selectedPages.size === 0) return null;

    setIsExporting(true);
    try {
      const srcDoc = await PDFDocument.load(pdfData);
      const newDoc = await PDFDocument.create();

      const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
      const srcDocPages = await newDoc.copyPages(
        srcDoc,
        sortedPages.map((p) => p - 1)
      );
      srcDocPages.forEach((page) => newDoc.addPage(page));

      const pdfBytes = await newDoc.save();
      return new Blob([pdfBytes], { type: "application/pdf" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể xuất file PDF"
      );
      return null;
    } finally {
      setIsExporting(false);
    }
  }, [pdfData, selectedPages]);

  return {
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
  };
}

export async function renderPdfPageToDataUrl(
  pdfDocument: PDFDocumentProxy,
  pageNumber: number,
  scale: number = 1.2
): Promise<string> {
  const page = await pdfDocument.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  return canvas.toDataURL("image/png");
}
