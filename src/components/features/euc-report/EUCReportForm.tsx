"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button, Space, Modal, message } from "antd";
import { DeleteOutlined, UploadOutlined, DownloadOutlined, ReloadOutlined, OpenAIOutlined, SettingOutlined } from "@ant-design/icons";
import { DatePicker, DataTable, Input, Select, Popup } from "@/components/ui";
import { Input as AntdInput } from "antd";
import type { TableAction } from "@/components/ui/DataTable";
import { ContentLayout } from "@/components/layouts";
import { useEucReport } from "@/features/euc-report";
import type { Student, ReportScoreColumn } from "@/features/euc-report";
import {
  getStudentScoreTotal,
  emptyScoresForColumns,
} from "@/features/euc-report/utils/scoreColumns";
import { useLayoutOptions } from "@/providers/layoutOptions";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

export interface EUCReportFormProps {
  onNextStep?: () => void;
}

// Separate component for editable input cells to avoid columns recreation
const EditableInputCell: React.FC<{
  initialValue: string;
  onValueChange: (value: string) => void;
  onBlur: (value: string) => void;
  type?: "text" | "number";
  min?: number;
  max?: number;
  step?: string | number;
  validate?: (value: string) => boolean;
}> = ({ initialValue, onValueChange, onBlur, type = "text", min, max, step, validate }) => {
  const [localValue, setLocalValue] = useState(initialValue);
  const isInitialMount = useRef(true);

  // Sync with initialValue only on mount or when it changes externally (not from typing)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Only sync if initialValue changed externally (user clicked a different cell)
    if (initialValue !== localValue) {
      setLocalValue(initialValue);
    }
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!validate || validate(newValue)) {
      setLocalValue(newValue);
      onValueChange(newValue);
    }
  };

  return (
    <Input
      value={localValue}
      onChange={handleChange}
      onBlur={() => {
        onBlur(localValue);
      }}
      autoFocus
      style={{ width: "100%" }}
      type={type}
      min={min}
      max={max}
      step={step}
    />
  );
};

// Separate component for Result textarea to avoid columns recreation
const ResultTextAreaCell: React.FC<{
  rowId: string;
  cellKey: string;
  initialValue: string;
  onValueChange: (value: string) => void;
  onBlur: (value: string) => void;
}> = ({ initialValue, onValueChange, onBlur }) => {
  const [localValue, setLocalValue] = useState(initialValue);
  const textareaRef = useRef<any>(null);

  // Sync with initialValue only when it changes externally (not from typing)
  useEffect(() => {
    if (initialValue !== localValue && localValue === "") {
      setLocalValue(initialValue);
    }
  }, [initialValue]);

  return (
    <AntdInput.TextArea
      ref={(el) => {
        if (el) {
          textareaRef.current = el;
        }
      }}
      value={localValue}
      onChange={(e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        onValueChange(newValue);
      }}
      onBlur={() => {
        onBlur(localValue);
      }}
      autoFocus
      autoSize={{ minRows: 1, maxRows: 10 }}
      style={{
        width: "100%",
        resize: "none",
        direction: "ltr",
        textAlign: "left",
        unicodeBidi: "normal",
        writingMode: "horizontal-tb",
      }}
      rows={1}
    />
  );
};

export const EUCReportForm: React.FC<EUCReportFormProps> = ({ onNextStep }) => {
  const {
    data,
    updateDate,
    updateExam,
    updateClass,
    updateTeacher,
    updateScoreColumns,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudents,
    clearStudents,
    saveCurrentData,
  } = useEucReport();
  const { setShowFooter, setFooterAction, setFooterLeftText } = useLayoutOptions();
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    columnId: string;
  } | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<any>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState<boolean>(false);
  const [criteriaModalOpen, setCriteriaModalOpen] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [criteria, setCriteria] = useState<string>("");
  const [generatingStudentId, setGeneratingStudentId] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftScoreColumns, setDraftScoreColumns] = useState<ReportScoreColumn[]>([]);

  const canProceedToNextStep =
    data.date && data.exam && data.class && data.teacher && data.students.length > 0;

  const getStudentValue = useCallback((student: Student, columnId: string): string => {
    switch (columnId) {
      case "fullName":
        return student.fullName || "";
      case "nickName":
        return student.nickName || "";
      case "result":
        return student.result || "";
      default:
        return student.scores[columnId] ?? "";
    }
  }, []);

  // Get editing value for current cell
  const getEditingValue = useCallback((rowId: string, columnId: string): string => {
    const key = `${rowId}-${columnId}`;
    return editingValues[key] ?? "";
  }, [editingValues]);

  // Set editing value for current cell
  const setEditingValue = useCallback((rowId: string, columnId: string, value: string) => {
    const key = `${rowId}-${columnId}`;
    setEditingValues(prev => ({ ...prev, [key]: value }));
  }, []);

  React.useEffect(() => {
    setShowFooter(true);
    setFooterLeftText("Step 1: Excel Report");
    setFooterAction({
      text: "Next Step",
      onClick: () => {
        if (onNextStep && canProceedToNextStep) {
          onNextStep();
        }
      },
      loading: false,
      disabled: !canProceedToNextStep,
    });
    return () => {
      setShowFooter(false);
      setFooterAction(null);
      setFooterLeftText(null);
    };
  }, [setShowFooter, setFooterAction, setFooterLeftText, onNextStep, canProceedToNextStep]);

  const columns = useMemo<ColumnDef<Student>[]>(() => {
    const scoreColDefs: ColumnDef<Student>[] = data.scoreColumns.map((col) => ({
      id: col.id,
      header: `${col.fieldName} (${col.maxPoint})`,
      size: 88,
      cell: ({ row }) => {
        const isEditing =
          editingCell?.rowId === row.original.id && editingCell?.columnId === col.id;
        const cellKey = `${row.original.id}-${col.id}`;
        const max = col.maxPoint;
        return isEditing ? (
          <EditableInputCell
            key={cellKey}
            initialValue={row.original.scores[col.id] ?? ""}
            type="number"
            min={0}
            max={max}
            step="0.1"
            validate={(value) => {
              if (value === "" || value === ".") return true;
              if (!/^\d*\.?\d*$/.test(value)) return false;
              const num = parseFloat(value);
              if (isNaN(num)) return value === "" || value === ".";
              return num >= 0 && num <= max;
            }}
            onValueChange={(value) => setEditingValue(row.original.id, col.id, value)}
            onBlur={(value) => {
              updateStudent(row.original.id, {
                scores: { ...row.original.scores, [col.id]: value },
              });
              saveCurrentData();
              setEditingCell(null);
              setEditingValues((prev) => {
                const newValues = { ...prev };
                delete newValues[cellKey];
                return newValues;
              });
            }}
          />
        ) : (
          <div
            onClick={() => {
              const value = getStudentValue(row.original, col.id);
              setEditingValue(row.original.id, col.id, value);
              setEditingCell({ rowId: row.original.id, columnId: col.id });
            }}
            style={{ cursor: "text", minHeight: "24px", padding: "4px 0" }}
          >
            {(row.original.scores[col.id] || "").length > 0 ? (
              row.original.scores[col.id]
            ) : (
              <span style={{ color: "#ff4d4f" }}>Click to edit</span>
            )}
          </div>
        );
      },
    }));

    return [
      {
        id: "_stt",
        header: "No",
        size: 64,
        meta: { align: "center" },
        cell: ({ row }) => {
          const rowIndex = data.students.findIndex((s) => s.id === row.original.id);
          return rowIndex + 1;
        },
      },
      {
        id: "fullName",
        header: "Full Name",
        size: 120,
        cell: ({ row }) => {
          const isEditing =
            editingCell?.rowId === row.original.id &&
            editingCell?.columnId === "fullName";
          const cellKey = `${row.original.id}-fullName`;
          return isEditing ? (
            <EditableInputCell
              key={cellKey}
              initialValue={row.original.fullName}
              onValueChange={(value) => setEditingValue(row.original.id, "fullName", value)}
              onBlur={(value) => {
                updateStudent(row.original.id, { fullName: value });
                saveCurrentData();
                setEditingCell(null);
                setEditingValues((prev) => {
                  const newValues = { ...prev };
                  delete newValues[cellKey];
                  return newValues;
                });
              }}
            />
          ) : (
            <div
              onClick={() => {
                const value = getStudentValue(row.original, "fullName");
                setEditingValue(row.original.id, "fullName", value);
                setEditingCell({ rowId: row.original.id, columnId: "fullName" });
              }}
              style={{ cursor: "text", minHeight: "24px", padding: "4px 0" }}
            >
              {row.original.fullName || (
                <span style={{ color: "#ff4d4f" }}>Click to edit</span>
              )}
            </div>
          );
        },
      },
      {
        id: "nickName",
        header: "Nick Name",
        size: 70,
        cell: ({ row }) => {
          const isEditing =
            editingCell?.rowId === row.original.id &&
            editingCell?.columnId === "nickName";
          const cellKey = `${row.original.id}-nickName`;
          return isEditing ? (
            <EditableInputCell
              key={cellKey}
              initialValue={row.original.nickName}
              onValueChange={(value) => setEditingValue(row.original.id, "nickName", value)}
              onBlur={(value) => {
                updateStudent(row.original.id, { nickName: value });
                saveCurrentData();
                setEditingCell(null);
                setEditingValues((prev) => {
                  const newValues = { ...prev };
                  delete newValues[cellKey];
                  return newValues;
                });
              }}
            />
          ) : (
            <div
              onClick={() => {
                const value = getStudentValue(row.original, "nickName");
                setEditingValue(row.original.id, "nickName", value);
                setEditingCell({ rowId: row.original.id, columnId: "nickName" });
              }}
              style={{ cursor: "text", minHeight: "24px", padding: "4px 0" }}
            >
              {row.original.nickName || (
                <span style={{ color: "#ff4d4f" }}>Click to edit</span>
              )}
            </div>
          );
        },
      },
      ...scoreColDefs,
      {
        id: "_total",
        header: "Total",
        size: 48,
        meta: { align: "center" },
        cell: ({ row }) => {
          const total = getStudentScoreTotal(row.original, data.scoreColumns);
          return (
            <div style={{ minHeight: "24px", padding: "4px 0" }}>
              {total % 1 === 0 ? total : total.toFixed(1)}
            </div>
          );
        },
      },
      {
        id: "result",
        header: "Result",
        size: 200,
        cell: ({ row }) => {
          const isEditing =
            editingCell?.rowId === row.original.id &&
            editingCell?.columnId === "result";
          const cellKey = `${row.original.id}-result`;
          return isEditing ? (
            <ResultTextAreaCell
              key={cellKey}
              rowId={row.original.id}
              cellKey={cellKey}
              initialValue={row.original.result}
              onValueChange={(value) => setEditingValue(row.original.id, "result", value)}
              onBlur={(value) => {
                updateStudent(row.original.id, { result: value });
                saveCurrentData();
                setEditingCell(null);
                setEditingValues((prev) => {
                  const newValues = { ...prev };
                  delete newValues[cellKey];
                  return newValues;
                });
              }}
            />
          ) : (
            <div
              onClick={() => {
                const value = getStudentValue(row.original, "result");
                setEditingValue(row.original.id, "result", value);
                setEditingCell({ rowId: row.original.id, columnId: "result" });
              }}
              style={{
                cursor: "text",
                minHeight: "24px",
                padding: "4px 0",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                lineHeight: "1.4",
              }}
            >
              {row.original.result || (
                <span style={{ color: "#ff4d4f" }}>Click to edit or Click generate with AI</span>
              )}
            </div>
          );
        },
      },
    ];
  }, [
    editingCell,
    data.students,
    data.scoreColumns,
    updateStudent,
    saveCurrentData,
    setEditingValue,
    getStudentValue,
  ]);

  const openScoreSettings = () => {
    setDraftScoreColumns(data.scoreColumns.map((c) => ({ ...c })));
    setSettingsOpen(true);
  };

  const handleAddDraftColumn = () => {
    setDraftScoreColumns((prev) => [
      ...prev,
      { id: crypto.randomUUID(), fieldName: "", maxPoint: 10 },
    ]);
  };

  const handleRemoveDraftColumn = (id: string) => {
    setDraftScoreColumns((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSaveScoreSettings = () => {
    for (const c of draftScoreColumns) {
      if (!c.fieldName.trim()) {
        message.error("Mỗi cột cần có tên (Field name).");
        return;
      }
      const mp = Number(c.maxPoint);
      if (!Number.isFinite(mp) || mp < 0) {
        message.error("Max point phải là số ≥ 0.");
        return;
      }
    }
    if (draftScoreColumns.length === 0) {
      message.error("Cần ít nhất một cột điểm.");
      return;
    }
    updateScoreColumns(
      draftScoreColumns.map((c) => ({
        id: c.id,
        fieldName: c.fieldName.trim(),
        maxPoint: Math.max(0, Number(c.maxPoint)),
      }))
    );
    setSettingsOpen(false);
    message.success("Đã lưu cấu hình cột.");
  };

  const draftMaxPointsTotal = useMemo(
    () =>
      draftScoreColumns.reduce(
        (sum, c) => sum + Math.max(0, Number(c.maxPoint) || 0),
        0
      ),
    [draftScoreColumns]
  );

  const checkApiKey = () => {
    const savedKey = localStorage.getItem("openrouter-auth");
    if (!savedKey) {
      setApiKeyModalOpen(true);
      return false;
    }
    return true;
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("openrouter-auth", apiKey.trim());
      setApiKeyModalOpen(false);
      setApiKey("");
      if (generatingStudentId) {
        setCriteriaModalOpen(true);
      }
    }
  };

  const handleGenerateClick = (student: Student) => {
    setGeneratingStudentId(student.id);
    setCriteria("");
    if (!checkApiKey()) {
      return;
    }
    setCriteriaModalOpen(true);
  };

  const handleGenerateResult = async () => {
    if (!criteria.trim() || !generatingStudentId) return;

    const savedKey = localStorage.getItem("openrouter-auth");
    if (!savedKey) {
      setApiKeyModalOpen(true);
      setCriteriaModalOpen(false);
      return;
    }

    setGenerating(true);
    try {
      const criteriaList = criteria
        .split('\n')
        .map(c => c.trim())
        .filter(c => c.length > 0)
        .map(c => `- ${c}`)
        .join('\n');

      const prompt = `Bạn là trợ lý giáo dục chuyên viết nhận xét học viên bằng tiếng Việt theo phong cách nhận xét chính thức trong môi trường giáo dục.

====================
MỤC TIÊU
====================

Dựa vào các ý đánh giá rời rạc về học viên được cung cấp, hãy viết thành một đoạn nhận xét hoàn chỉnh, tự nhiên, chuẩn mực sư phạm và mang tính định hướng học tập.

====================
QUY TẮC VIẾT BẮT BUỘC
====================

1. Cấu trúc đoạn nhận xét phải gồm đủ các phần sau:

- Nhận xét thái độ học tập
- Đánh giá năng lực hoặc mức độ tiến bộ
- Nêu điểm cần cải thiện (chỉ khi input có đề cập)
- Đưa ra lời khuyến khích hoặc định hướng học tập

2. Quy tắc văn phong:

- Luôn gọi học viên là "Học viên (HV)", không nói HV là em/người
- Viết thành DUY NHẤT một đoạn văn hoàn chỉnh
- Văn phong sư phạm, khách quan, mang tính đánh giá chính thức
- Ngôn ngữ tự nhiên, rõ ràng, phù hợp báo cáo giáo dục
- Không sử dụng bullet list
- Không xuống dòng giữa đoạn
- Không sử dụng giọng văn hội thoại, thân mật hoặc cảm xúc quá mức
- Không sử dụng các cụm từ như:
  - "chúng ta"
  - "hãy cùng"
  - "hành trình học tập"
  - Các câu mang tính trò chuyện
- Đến đoạn khuyến khích thì luôn bắt đầu bằng "Khuyến khích HV"

====================
QUY TẮC CÂU MỞ ĐẦU (BẮT BUỘC TUYỆT ĐỐI)
====================

- Câu đầu tiên phải bắt đầu bằng:
  "Học viên (HV)" + mô tả trực tiếp đặc điểm học tập

- Không được dùng động từ liên kết "là" ngay sau "Học viên (HV)"

- Không được sử dụng các cấu trúc:
  + "Học viên (HV) là..."
  + "Học viên (HV) là một..."
  + "Học viên (HV) là người..."

Ví dụ đúng:
Học viên (HV) chăm chỉ, có thái độ học tập tích cực...

Ví dụ sai:
Học viên (HV) là một người chăm chỉ...

3. Kiểm soát nội dung (RẤT QUAN TRỌNG):

- Phải sử dụng toàn bộ thông tin đánh giá được cung cấp
- Không được suy diễn phẩm chất, thái độ hoặc năng lực nếu input không đề cập trực tiếp
- Không được thêm thông tin mới ngoài dữ liệu đầu vào
- Không được suy luận các đặc điểm như:
  - tinh thần trách nhiệm
  - sự chủ động
  - tính kỷ luật
  - thái độ học tập khác nếu input không đề cập
- Nếu input không có điểm yếu → KHÔNG được tự thêm nội dung cần cải thiện
- Nếu input có nội dung khuyến khích → Đoạn văn phải kết thúc bằng lời động viên phù hợp
- Không được suy luận từ hành vi sang phẩm chất cá nhân.
- Chỉ được mô tả đúng nội dung xuất hiện trong input.

4. Quy tắc diễn đạt:

- Có thể diễn đạt lại nội dung nhưng phải giữ nguyên ý nghĩa
- Tránh lặp lại nguyên văn input
- Tránh lặp cấu trúc câu đơn điệu
- Giữ tone đánh giá giáo viên nhất quán

5. Quy định độ dài:

- Độ dài đoạn văn: 50 – 70 từ 


====================
INPUT ĐÁNH GIÁ HỌC VIÊN
====================

${criteriaList}

====================
OUTPUT
====================

Chỉ trả về đoạn nhận xét hoàn chỉnh.
Không giải thích.
Không thêm tiêu đề.
Không thêm nhận xét ngoài yêu cầu.`;

      // Ensure API key has Bearer prefix
      const authHeader = savedKey.startsWith("Bearer ") ? savedKey : `Bearer ${savedKey}`;
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify({
          model: "google/gemma-3n-e2b-it:free",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate result");
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content || "";

      if (generatedText && generatingStudentId) {
        updateStudent(generatingStudentId, { result: generatedText.trim() });
        saveCurrentData();
      }

      setCriteriaModalOpen(false);
      setCriteria("");
      setGeneratingStudentId(null);
    } catch (error) {
      console.error("Error generating result:", error);
      alert("Có lỗi xảy ra khi tạo đánh giá. Vui lòng thử lại.");
    } finally {
      setGenerating(false);
    }
  };

  const tableActions: TableAction<Student>[] = useMemo(
    () => [
      {
        key: "generate",
        label: "Generate",
        icon: <OpenAIOutlined style={{ color: "#1890ff" }} />,
        onClick: (row) => {
          handleGenerateClick(row);
        },
      },
      {
        key: "delete",
        label: "Delete",
        icon: <DeleteOutlined style={{ color: "#ff4d4f" }} />,
        onClick: (row) => {
          deleteStudent(row.id);
        },
      },
    ],
    [deleteStudent]
  );

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bin = event.target?.result;
        const workbook = XLSX.read(bin, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        const students: Student[] = [];
        const cols = data.scoreColumns;
        for (let i = 5; i < jsonData.length; i++) {
          const row = jsonData[i] as unknown[];
          const fullName = row[1]?.toString().trim() || "";
          const nickName = row[2]?.toString().trim() || "";

          if (fullName || nickName) {
            const scores = emptyScoresForColumns(cols);
            cols.forEach((col, idx) => {
              scores[col.id] = row[3 + idx]?.toString().trim() || "";
            });
            students.push({
              id: `${Date.now()}-${i}`,
              fullName,
              nickName,
              scores,
              title: "",
              result: "",
            });
          }
        }

        if (students.length > 0) {
          importStudents(students);
        }
      } catch (error) {
        console.error("Error reading Excel file:", error);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleExport = async () => {
    if (!data.class || !data.exam) {
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(data.class);

    const examText = data.exam.toUpperCase();
    const className = data.class.toUpperCase();
    const dateText = data.date ? data.date.format("DD/MM/YYYY") : "";

    const nScore = data.scoreColumns.length;
    worksheet.getColumn(1).width = 8;
    worksheet.getColumn(2).width = 45;
    worksheet.getColumn(3).width = 18;
    for (let c = 0; c < nScore; c++) {
      worksheet.getColumn(4 + c).width = 16;
    }
    worksheet.getColumn(4 + nScore).width = 12;
    worksheet.getColumn(5 + nScore).width = 70;

    const defaultFont = { name: "Times New Roman" };
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.font = defaultFont;
      });
    });

    const cellC2 = worksheet.getCell("C2");
    cellC2.value = `${examText} REPORT`;
    cellC2.font = { name: "Times New Roman", size: 24, bold: true };
    worksheet.mergeCells("C2:E2");
    cellC2.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

    const cellB3 = worksheet.getCell("B3");
    cellB3.value = `DATE: ${dateText}`;
    cellB3.font = { name: "Times New Roman", size: 12, bold: true };
    cellB3.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cellB3.alignment = { wrapText: true };

    const cellB4 = worksheet.getCell("B4");
    cellB4.value = `CLASS: ${data.class}`;
    cellB4.font = { name: "Times New Roman", size: 12, bold: true };
    cellB4.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cellB4.alignment = { wrapText: true };

    const cellB5 = worksheet.getCell("B5");
    cellB5.value = `TEACHER: ${data.teacher}`;
    cellB5.font = { name: "Times New Roman", size: 12, bold: true };
    cellB5.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cellB5.alignment = { wrapText: true };

    const headerRow = 6;
    const headers = [
      "NO",
      "FULL NAME",
      "NICK NAME",
      ...data.scoreColumns.map(
        (c) => `${c.fieldName.toUpperCase()} (${c.maxPoint})`
      ),
      "TOTAL",
      "RESULT",
    ];

    headers.forEach((header, index) => {
      const cell = worksheet.getCell(headerRow, index + 1);
      cell.value = header;
      cell.font = { name: "Times New Roman", size: 18, bold: true };
      if (index !== 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFF00" },
        };
      }
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    });

    data.students.forEach((student, index) => {
      const row = headerRow + 1 + index;
      const total = getStudentScoreTotal(student, data.scoreColumns);

      const rowData = [
        index + 1,
        student.fullName,
        student.nickName,
        ...data.scoreColumns.map((c) => student.scores[c.id] || ""),
        total,
        student.result || "",
      ];

      rowData.forEach((value, colIndex) => {
        const cell = worksheet.getCell(row, colIndex + 1);
        cell.value = value;
        const isFullNameOrNickName = colIndex === 1 || colIndex === 2;
        cell.font = {
          name: "Times New Roman",
          size: 16,
          bold: isFullNameOrNickName,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        const lastNumericCol = 3 + nScore;
        if (colIndex === 0 || (colIndex >= 3 && colIndex <= lastNumericCol)) {
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        } else {
          cell.alignment = { vertical: "middle", wrapText: true };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${className} - ${examText} REPORT.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <ContentLayout>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
          <Space size="large" wrap>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: !data.exam ? "#ef4444" : "inherit" }}>Exam</label>
              <Select
                value={data.exam}
                onChange={updateExam}
                onBlur={saveCurrentData}
                style={{ width: 200 }}
                placeholder="Select exam"
                options={[
                  { label: "Midterm", value: "Midterm" },
                  { label: "Final", value: "Final" },
                ]}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: !data.date ? "#ef4444" : "inherit" }}>Date</label>
              <DatePicker
                value={data.date}
                onChange={updateDate}
                onOpenChange={(open) => {
                  if (!open) {
                    saveCurrentData();
                  }
                }}
                style={{ width: 200 }}
                placeholder="Select date"
                format="DD/MM/YYYY"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: !data.class || data.class.trim() === "" ? "#ef4444" : "inherit" }}>Class</label>
              <Input
                value={data.class}
                onChange={(e) => updateClass(e.target.value)}
                onBlur={saveCurrentData}
                placeholder="Enter class"
                style={{ width: 200 }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: !data.teacher || data.teacher.trim() === "" ? "#ef4444" : "inherit" }}>Teacher</label>
              <Input
                value={data.teacher}
                onChange={(e) => updateTeacher(e.target.value)}
                onBlur={saveCurrentData}
                placeholder="Enter teacher"
                style={{ width: 200 }}
              />
            </div>
          </Space>
          <Space>
            <Button type="default" icon={<SettingOutlined />} onClick={openScoreSettings}>
              Settings
            </Button>
            <Button type="default" icon={<DownloadOutlined />} onClick={handleExport}>
              Export
            </Button>
            <Button type="default" icon={<UploadOutlined />} onClick={handleImportClick}>
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={clearStudents}
              disabled={data.students.length === 0}
            >
              Reset
            </Button>
            <Button type="primary" onClick={addStudent}>
              Add Student
            </Button>
          </Space>
        </div>

        <div style={{ height: "calc(100vh - 300px)" }}>
          <DataTable
            columns={columns}
            data={data.students}
            rowKey={(row) => row.id}
            height="100%"
            actions={tableActions}
            actionsColumnWidth={60}
          />
        </div>
      </Space>

      <Modal
        title="Score columns"
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        styles={{
          body: {
            paddingTop: 16,
            paddingBottom: 16,
          },
        }}
        footer={[
          <Button key="close" onClick={() => setSettingsOpen(false)}>
            Close
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveScoreSettings}>
            Save
          </Button>,
        ]}
        width={560}
        destroyOnClose
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 100px 40px",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: "#374151",
          }}
        >
          <span>Field name</span>
          <span>Max point ({draftMaxPointsTotal})</span>
          <span />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
          {draftScoreColumns.map((col) => (
            <div
              key={col.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 40px",
                gap: 8,
                alignItems: "center",
              }}
            >
              <Input
                value={col.fieldName}
                placeholder="Column name"
                onChange={(e) =>
                  setDraftScoreColumns((prev) =>
                    prev.map((c) =>
                      c.id === col.id ? { ...c, fieldName: e.target.value } : c
                    )
                  )
                }
              />
              <Input
                type="number"
                min={0}
                step={1}
                value={col.maxPoint}
                onChange={(e) =>
                  setDraftScoreColumns((prev) =>
                    prev.map((c) =>
                      c.id === col.id
                        ? { ...c, maxPoint: Number(e.target.value) }
                        : c
                    )
                  )
                }
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveDraftColumn(col.id)}
                aria-label="Delete column"
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <Button type="dashed" onClick={handleAddDraftColumn} block>
            Add column
          </Button>
        </div>
      </Modal>

      {/* API Key Modal */}
      <Popup
        open={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        title="OpenRouter API"
        width={500}
        showFooter
        onOk={handleSaveApiKey}
        okText="Save"
        cancelText="Cancel"
      >
        <div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              API Key
            </label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-********"
              onPressEnter={handleSaveApiKey}
              autoFocus
            />
          </div>
        </div>
      </Popup>

      {/* Criteria Modal */}
      {(() => {
        const currentStudent = generatingStudentId 
          ? data.students.find(s => s.id === generatingStudentId)
          : null;

        return (
          <Popup
            open={criteriaModalOpen}
            onClose={() => {
              setCriteriaModalOpen(false);
              setCriteria("");
              setGeneratingStudentId(null);
            }}
            title="Result with GenAI"
            width={600}
            showFooter
            onOk={handleGenerateResult}
            okText="Generate with AI"
            cancelText="Cancel"
            loading={generating}
          >
            <div>
              {currentStudent && (
                <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: "14px", color: "#8c8c8c", marginBottom: "4px" }}>Student</div>
                  <div style={{ fontSize: "16px", fontWeight: 500 }}>
                    {currentStudent.fullName}
                    {currentStudent.nickName && ` - ${currentStudent.nickName}`}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: "16px" }}>
                <AntdInput.TextArea
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                  placeholder={`Example:
Nói chuyện nhiều
Hay ghẹo cô Vy chưa có người yêu
Năng động
Tiếp thu nhanh`}
                  rows={8}
                  autoSize={{ minRows: 6, maxRows: 12 }}
                />
              </div>
            </div>
          </Popup>
        );
      })()}
    </ContentLayout>
  );
};

export default EUCReportForm;
