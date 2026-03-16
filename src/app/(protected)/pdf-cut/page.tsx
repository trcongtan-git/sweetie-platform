"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePdfCut } from "@/features/pdf-cut/hooks/usePdfCut";
import { PDFUploadModal, PDFCutContent } from "@/components/features/pdf-cut";
import { saveAs } from "file-saver";
import { message } from "antd";

export default function PdfCutPage() {
  const router = useRouter();
  const {
    pdfData,
    fileName,
    pageCount,
    selectedPages,
    isExporting,
    error,
    pdfJsDocument,
    loadPdf,
    reset,
    togglePage,
    selectAll,
    selectNone,
    exportSelectedPages,
  } = usePdfCut();

  const handleCloseUpload = useCallback(() => {
    router.replace("/euc-report");
  }, [router]);

  const handleExport = useCallback(async () => {
    const blob = await exportSelectedPages();
    if (blob) {
      saveAs(blob, `${fileName || "cut"}_selected.pdf`);
      message.success("Xuất file thành công");
    } else if (error) {
      message.error(error);
    }
  }, [exportSelectedPages, fileName, error]);

  return (
    <>
      {!pdfData && (
        <PDFUploadModal
          open
          onClose={handleCloseUpload}
          onFileSelected={loadPdf}
        />
      )}
      {pdfData && (
        <PDFCutContent
          fileName={fileName}
          pageCount={pageCount}
          selectedPages={selectedPages}
          isExporting={isExporting}
          error={error}
          pdfJsDocument={pdfJsDocument}
          onReset={reset}
          onTogglePage={togglePage}
          onSelectAll={selectAll}
          onSelectNone={selectNone}
          onExport={handleExport}
        />
      )}
    </>
  );
}
