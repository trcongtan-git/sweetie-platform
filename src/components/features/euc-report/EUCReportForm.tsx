"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button, Space } from "antd";
import { DeleteOutlined, UploadOutlined, DownloadOutlined, ReloadOutlined, OpenAIOutlined } from "@ant-design/icons";
import { DatePicker, DataTable, Input, Select, Popup } from "@/components/ui";
import { Input as AntdInput } from "antd";
import type { TableAction } from "@/components/ui/DataTable";
import { ContentLayout } from "@/components/layouts";
import { useEucReport } from "@/features/euc-report";
import type { Student } from "@/features/euc-report";
import { useLayoutOptions } from "@/providers/layoutOptions";
import dayjs from "dayjs";
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
  const { data, updateDate, updateExam, updateClass, updateTeacher, addStudent, updateStudent, deleteStudent, importStudents, clearStudents, saveCurrentData } =
    useEucReport();
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

  const canProceedToNextStep =
    data.date && data.exam && data.class && data.teacher && data.students.length > 0;

  // Helper function to get value from student by columnId
  const getStudentValue = useCallback((student: Student, columnId: string): string => {
    switch (columnId) {
      case "fullName":
        return student.fullName || "";
      case "nickName":
        return student.nickName || "";
      case "vocabulary":
        return student.vocabulary || "";
      case "grammar":
        return student.grammar || "";
      case "listening":
        return student.listening || "";
      case "reading":
        return student.reading || "";
      case "writing":
        return student.writing || "";
      case "speaking":
        return student.speaking || "";
      case "result":
        return student.result || "";
      default:
        return "";
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

  const columns = useMemo<ColumnDef<Student>[]>(
    () => {
      console.log("[DEBUG] Columns recreating, editingValues:", editingValues);
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
                setEditingValues(prev => {
                  const newValues = { ...prev };
                  delete newValues[cellKey];
                  return newValues;
                });
              }}
            />
          ) : (
            <div
              onClick={() => {
                console.log("[DEBUG] Clicked fullName cell for student:", row.original.id);
                const value = getStudentValue(row.original, "fullName");
                console.log("[DEBUG] Setting editingValue to:", value);
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
                setEditingValues(prev => {
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
                console.log("[DEBUG] Clicked nickName cell, setting value:", value);
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
      {
        id: "listening",
        header: "Listening (25)",
        size: 70,
        cell: ({ row }) => {
          const isEditing =
            editingCell?.rowId === row.original.id &&
            editingCell?.columnId === "listening";
          const cellKey = `${row.original.id}-listening`;
          return isEditing ? (
            <EditableInputCell
              key={cellKey}
              initialValue={row.original.listening}
              type="number"
              min={0}
              max={25}
              step="0.1"
              validate={(value) => {
                if (value === "" || value === ".") return true;
                if (!/^\d*\.?\d*$/.test(value)) return false;
                const num = parseFloat(value);
                if (isNaN(num)) return value === "" || value === ".";
                return num >= 0 && num <= 25;
              }}
              onValueChange={(value) => setEditingValue(row.original.id, "listening", value)}
              onBlur={(value) => {
                updateStudent(row.original.id, { listening: value });
                saveCurrentData();
                setEditingCell(null);
                setEditingValues(prev => {
                  const newValues = { ...prev };
                  delete newValues[cellKey];
                  return newValues;
                });
              }}
            />
          ) : (
            <div
              onClick={() => {
                const value = getStudentValue(row.original, "listening");
                console.log("[DEBUG] Clicked listening cell, setting value:", value);
                setEditingValue(row.original.id, "listening", value);
                setEditingCell({ rowId: row.original.id, columnId: "listening" });
              }}
              style={{ cursor: "text", minHeight: "24px", padding: "4px 0" }}
            >
              {row.original.listening || (
                <span style={{ color: "#ff4d4f" }}>Click to edit</span>
              )}
            </div>
          );
        },
      },
      {
        id: "reading",
        header: "Reading & Writing (50)",
        size: 70,
        cell: ({ row }) => {
          const isEditing =
            editingCell?.rowId === row.original.id &&
            editingCell?.columnId === "reading";
          const cellKey = `${row.original.id}-reading`;
          return isEditing ? (
            <EditableInputCell
              key={cellKey}
              initialValue={row.original.reading}
              type="number"
              min={0}
              max={50}
              step="0.1"
              validate={(value) => {
                if (value === "" || value === ".") return true;
                if (!/^\d*\.?\d*$/.test(value)) return false;
                const num = parseFloat(value);
                if (isNaN(num)) return value === "" || value === ".";
                return num >= 0 && num <= 50;
              }}
              onValueChange={(value) => setEditingValue(row.original.id, "reading", value)}
              onBlur={(value) => {
                updateStudent(row.original.id, { reading: value });
                saveCurrentData();
                setEditingCell(null);
                setEditingValues(prev => {
                  const newValues = { ...prev };
                  delete newValues[cellKey];
                  return newValues;
                });
              }}
            />
          ) : (
            <div
              onClick={() => {
                const value = getStudentValue(row.original, "reading");
                console.log("[DEBUG] Clicked reading cell, setting value:", value);
                setEditingValue(row.original.id, "reading", value);
                setEditingCell({
                  rowId: row.original.id,
                  columnId: "reading",
                });
              }}
              style={{ cursor: "text", minHeight: "24px", padding: "4px 0" }}
            >
              {row.original.reading || (
                <span style={{ color: "#ff4d4f" }}>Click to edit</span>
              )}
            </div>
          );
        },
      },
      {
        id: "speaking",
        header: "Speaking (25)",
        size: 70,
        cell: ({ row }) => {
          const isEditing =
            editingCell?.rowId === row.original.id &&
            editingCell?.columnId === "speaking";
          const cellKey = `${row.original.id}-speaking`;
          return isEditing ? (
            <EditableInputCell
              key={cellKey}
              initialValue={row.original.speaking}
              type="number"
              min={0}
              max={25}
              step="0.1"
              validate={(value) => {
                if (value === "" || value === ".") return true;
                if (!/^\d*\.?\d*$/.test(value)) return false;
                const num = parseFloat(value);
                if (isNaN(num)) return value === "" || value === ".";
                return num >= 0 && num <= 25;
              }}
              onValueChange={(value) => setEditingValue(row.original.id, "speaking", value)}
              onBlur={(value) => {
                updateStudent(row.original.id, { speaking: value });
                saveCurrentData();
                setEditingCell(null);
                setEditingValues(prev => {
                  const newValues = { ...prev };
                  delete newValues[cellKey];
                  return newValues;
                });
              }}
            />
          ) : (
            <div
              onClick={() => {
                const value = getStudentValue(row.original, "speaking");
                console.log("[DEBUG] Clicked speaking cell, setting value:", value);
                setEditingValue(row.original.id, "speaking", value);
                setEditingCell({ rowId: row.original.id, columnId: "speaking" });
              }}
              style={{ cursor: "text", minHeight: "24px", padding: "4px 0" }}
            >
              {row.original.speaking || (
                <span style={{ color: "#ff4d4f" }}>Click to edit</span>
              )}
            </div>
          );
        },
      },
      {
        id: "title",
        header: "Total",
        size: 40,
        meta: { align: "center" },
        cell: ({ row }) => {
          const listening = parseFloat(row.original.listening) || 0;
          const reading = parseFloat(row.original.reading) || 0;
          const speaking = parseFloat(row.original.speaking) || 0;
          const total = listening + reading + speaking;
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
          // Use a separate component to avoid columns recreation
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
                setEditingValues(prev => {
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
                console.log("[DEBUG] Clicked result cell, setting value:", value);
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
    },
    [editingCell, data, updateStudent, saveCurrentData, setEditingValue, getStudentValue]
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

      const prompt = `Hãy tạo ra văn bản đánh giá học viên từ 50-100 từ dựa trên các tiêu chí sau:\n\n${criteriaList}\n\nYÊU CẦU:\n1. Chỉ output nội dung đánh giá, không thêm text khác\n2. Bắt đầu bằng "Học viên (HV)..."\n3. Viết thành một đoạn văn liền mạch, không xuống dòng\n4. Cuối cùng thêm phần "Khuyến khích..." để học viên cải thiện\n5. Chỉ đưa khuyến khích, không thêm "nếu giữ vững..."\n6. Văn phong tự nhiên như giáo viên tiếng Anh có nhiều năm kinh nghiệm\n7. Không tạo cảm giác AI hóa\n8. Dùng từ ngữ tự nhiên, bình dị, không quá cao siêu\n9. TUYỆT ĐỐI không sử dụng các từ thân mật như "nhé", "nhỉ", "đấy", "vậy", "nhá", "đó" trong câu\n\nVÍ DỤ THAM KHẢO:\n\nHọc viên (HV) ngoan, có thái độ học tập tích cực và chủ động tham gia các hoạt động trên lớp. Em có sự tiến bộ rõ rệt, ghi nhớ từ vựng và kỹ năng viết khá tốt. Khuyến khích tiếp tục duy trì tinh thần học tập, ôn từ đều đặn và luyện nói sau mỗi buổi học để nâng cao hiệu quả ghi nhớ.\n\nHọc viên (HV) chăm ngoan, tích cực trong học tập và phối hợp tốt với lớp. Khả năng ghi nhớ và sử dụng từ vựng khá tốt, phát âm rõ và diễn đạt lưu loát. Vận dụng linh hoạt các cấu trúc đã học. Khuyến khích tiếp tục phát huy để nâng cao kỹ năng giao tiếp.\n\nHọc viên (HV) học tập tích cực, nghiêm túc và hòa đồng với bạn bè. Em có tiến bộ trong việc ghi nhớ từ và đúng chính tả. Tuy nhiên cần tự tin hơn khi nói và chú ý áp dụng mẫu câu. Khuyến khích HV tiếp tục duy trì tinh thần chăm chỉ, luyện nói thường xuyên và làm bài cẩn thận hơn.`;

      // Ensure API key has Bearer prefix
      const authHeader = savedKey.startsWith("Bearer ") ? savedKey : `Bearer ${savedKey}`;
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify({
          model: "mistralai/devstral-2512:free",
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
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        const students: Student[] = [];
        for (let i = 5; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          const fullName = row[1]?.toString().trim() || "";
          const nickName = row[2]?.toString().trim() || "";

          if (fullName || nickName) {
            students.push({
              id: `${Date.now()}-${i}`,
              fullName,
              nickName,
              vocabulary: "",
              grammar: "",
              listening: "",
              reading: "",
              writing: "",
              speaking: "",
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

    worksheet.getColumn("A").width = 8;
    worksheet.getColumn("B").width = 45;
    worksheet.getColumn("C").width = 18;
    worksheet.getColumn("D").width = 18;
    worksheet.getColumn("E").width = 18;
    worksheet.getColumn("F").width = 18;
    worksheet.getColumn("G").width = 18;
    worksheet.getColumn("H").width = 70;

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
      "LISTENING (25)",
      "READING & WRITING (50)",
      "SPEAKING (25)",
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
      const listening = parseFloat(student.listening) || 0;
      const reading = parseFloat(student.reading) || 0;
      const speaking = parseFloat(student.speaking) || 0;
      const total = listening + reading + speaking;

      const rowData = [
        index + 1,
        student.fullName,
        student.nickName,
        student.listening || "",
        student.reading || "",
        student.speaking || "",
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
        if (colIndex === 0 || (colIndex >= 3 && colIndex <= 6)) {
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
