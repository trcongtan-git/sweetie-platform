"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Button, Radio } from "antd";
import { LeftOutlined, RightOutlined, DownloadOutlined } from "@ant-design/icons";
import { ContentLayout } from "@/components/layouts";
import { useEucReport } from "@/features/euc-report";
import type { Student } from "@/features/euc-report";
import { useLayoutOptions } from "@/providers/layoutOptions";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

export interface EUCReportStep2Props {
  onBackStep?: () => void;
}

export const EUCReportStep2: React.FC<EUCReportStep2Props> = ({ onBackStep }) => {
  const { data, updateStudent, saveCurrentData } = useEucReport();
  const { setShowFooter, setFooterAction, setFooterLeftText, setFooterLeftAction, setHeaderCenterContent } = useLayoutOptions();
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalStudents = data.students.length;
  const cardsPerPage = 2;
  const totalPages = Math.ceil(totalStudents / cardsPerPage);

  const currentStudents = useMemo(() => {
    return data.students.slice(currentIndex, currentIndex + cardsPerPage);
  }, [data.students, currentIndex]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(Math.max(0, currentIndex - cardsPerPage));
    }
  }, [currentIndex, cardsPerPage]);

  const handleNext = useCallback(() => {
    if (currentIndex + cardsPerPage < totalStudents) {
      setCurrentIndex(Math.min(currentIndex + cardsPerPage, totalStudents - cardsPerPage));
    }
  }, [currentIndex, cardsPerPage, totalStudents]);

  const getStudentScore = (student: Student) => {
    const listening = parseFloat(student.listening) || 0;
    const readingWriting = parseFloat(student.reading) || 0;
    const speaking = parseFloat(student.speaking) || 0;
    const total = listening + readingWriting + speaking;
    return { listening, readingWriting, speaking, total };
  };

  const StudentCard: React.FC<{ student: Student }> = ({ student }) => {
    const scores = getStudentScore(student);
    const dateText = data.date ? data.date.format("DD/MM/YYYY") : "";
    const remarks = student.remarks || {};
    const academicAchievement = student.academicAchievement || {};

    // Helper function to check if a criteria is selected
    const isRemarksSelected = (key: keyof typeof remarks): boolean => {
      return !!remarks[key] && remarks[key] !== "";
    };

    const isAcademicAchievementSelected = (key: keyof typeof academicAchievement): boolean => {
      return !!academicAchievement[key] && academicAchievement[key] !== "";
    };

    const handleRemarksChange = (criteria: keyof typeof remarks, value: string) => {
      updateStudent(student.id, {
        remarks: {
          ...remarks,
          [criteria]: value,
        },
      });
      // Save to localStorage after a short delay to ensure state is updated
      setTimeout(() => {
        saveCurrentData();
      }, 0);
    };

    const handleAcademicAchievementChange = (criteria: keyof typeof academicAchievement, value: string) => {
      updateStudent(student.id, {
        academicAchievement: {
          ...academicAchievement,
          [criteria]: value,
        },
      });
      // Save to localStorage after a short delay to ensure state is updated
      setTimeout(() => {
        saveCurrentData();
      }, 0);
    };

    return (
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "24px",
          backgroundColor: "#fff",
          height: "100%",
        }}
      >
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "20px", fontWeight: 600, color: "#155eef" }}>
                          {student.fullName} - {student.nickName}
                        </div>
                        <div style={{ fontSize: "14px", color: "#6b7280" }}>
                          {data.exam} • {dateText} • {data.class}
                        </div>
                      </div>
                    </div>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
            GRADE RESULT
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #e5e7eb",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                <th
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  LISTENING (25)
                </th>
                <th
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  READING &amp; WRITING (50)
                </th>
                <th
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  SPEAKING (25)
                </th>
                <th
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  TOTAL SCORE
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                  }}
                >
                  {student.listening || "-"}
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                  }}
                >
                  {student.reading || "-"}
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                  }}
                >
                  {student.speaking || "-"}
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {scores.total % 1 === 0 ? scores.total : scores.total.toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
            REMARKS
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #e5e7eb",
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                <th
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: 600,
                    width: "60%",
                  }}
                ></th>
                <th
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                    width: "10%",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#f0f0f0",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    1
                  </div>
                </th>
                <th
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                    width: "10%",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#f0f0f0",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    2
                  </div>
                </th>
                <th
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                    width: "10%",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#f0f0f0",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    3
                  </div>
                </th>
                <th
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                    width: "10%",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#f0f0f0",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    4
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    fontSize: "14px",
                    color: !isRemarksSelected("volunteering") ? "#ef4444" : "inherit",
                  }}
                >
                  Volunteering (Xung phong phát biểu)
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="1"
                    checked={remarks.volunteering === "1"}
                    onChange={() => handleRemarksChange("volunteering", "1")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="2"
                    checked={remarks.volunteering === "2"}
                    onChange={() => handleRemarksChange("volunteering", "2")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="3"
                    checked={remarks.volunteering === "3"}
                    onChange={() => handleRemarksChange("volunteering", "3")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="4"
                    checked={remarks.volunteering === "4"}
                    onChange={() => handleRemarksChange("volunteering", "4")}
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    fontSize: "14px",
                    color: !isRemarksSelected("participation") ? "#ef4444" : "inherit",
                  }}
                >
                  Participation in class activities (Tham gia các hoạt động)
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="1"
                    checked={remarks.participation === "1"}
                    onChange={() => handleRemarksChange("participation", "1")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="2"
                    checked={remarks.participation === "2"}
                    onChange={() => handleRemarksChange("participation", "2")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="3"
                    checked={remarks.participation === "3"}
                    onChange={() => handleRemarksChange("participation", "3")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="4"
                    checked={remarks.participation === "4"}
                    onChange={() => handleRemarksChange("participation", "4")}
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    fontSize: "14px",
                    color: !isRemarksSelected("attentiveness") ? "#ef4444" : "inherit",
                  }}
                >
                  Attentiveness in class (Chăm chú nghe giảng)
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="1"
                    checked={remarks.attentiveness === "1"}
                    onChange={() => handleRemarksChange("attentiveness", "1")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="2"
                    checked={remarks.attentiveness === "2"}
                    onChange={() => handleRemarksChange("attentiveness", "2")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="3"
                    checked={remarks.attentiveness === "3"}
                    onChange={() => handleRemarksChange("attentiveness", "3")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="4"
                    checked={remarks.attentiveness === "4"}
                    onChange={() => handleRemarksChange("attentiveness", "4")}
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    fontSize: "14px",
                    color: !isRemarksSelected("carefulness") ? "#ef4444" : "inherit",
                  }}
                >
                  Carefulness (Cẩn thận khi làm bài)
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="1"
                    checked={remarks.carefulness === "1"}
                    onChange={() => handleRemarksChange("carefulness", "1")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="2"
                    checked={remarks.carefulness === "2"}
                    onChange={() => handleRemarksChange("carefulness", "2")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="3"
                    checked={remarks.carefulness === "3"}
                    onChange={() => handleRemarksChange("carefulness", "3")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="4"
                    checked={remarks.carefulness === "4"}
                    onChange={() => handleRemarksChange("carefulness", "4")}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
            ACADEMIC ACHIEVEMENT
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #e5e7eb",
              tableLayout: "fixed",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                <th
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: 600,
                    width: "60%",
                  }}
                ></th>
                <th
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                    width: "10%",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#f0f0f0",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    1
                  </div>
                </th>
                <th
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                    width: "10%",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#f0f0f0",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    2
                  </div>
                </th>
                <th
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                    width: "10%",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#f0f0f0",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    3
                  </div>
                </th>
                <th
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                    width: "10%",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#f0f0f0",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    4
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    fontSize: "14px",
                    color: !isAcademicAchievementSelected("vocabularyRetention") ? "#ef4444" : "inherit",
                  }}
                >
                  Vocabulary retention (Mức độ nhớ từ)
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="1"
                    checked={academicAchievement.vocabularyRetention === "1"}
                    onChange={() => handleAcademicAchievementChange("vocabularyRetention", "1")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="2"
                    checked={academicAchievement.vocabularyRetention === "2"}
                    onChange={() => handleAcademicAchievementChange("vocabularyRetention", "2")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="3"
                    checked={academicAchievement.vocabularyRetention === "3"}
                    onChange={() => handleAcademicAchievementChange("vocabularyRetention", "3")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="4"
                    checked={academicAchievement.vocabularyRetention === "4"}
                    onChange={() => handleAcademicAchievementChange("vocabularyRetention", "4")}
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    fontSize: "14px",
                    color: !isAcademicAchievementSelected("pronunciation") ? "#ef4444" : "inherit",
                  }}
                >
                  Pronunciation (Phát âm)
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="1"
                    checked={academicAchievement.pronunciation === "1"}
                    onChange={() => handleAcademicAchievementChange("pronunciation", "1")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="2"
                    checked={academicAchievement.pronunciation === "2"}
                    onChange={() => handleAcademicAchievementChange("pronunciation", "2")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="3"
                    checked={academicAchievement.pronunciation === "3"}
                    onChange={() => handleAcademicAchievementChange("pronunciation", "3")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="4"
                    checked={academicAchievement.pronunciation === "4"}
                    onChange={() => handleAcademicAchievementChange("pronunciation", "4")}
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    fontSize: "14px",
                    color: !isAcademicAchievementSelected("grammarUse") ? "#ef4444" : "inherit",
                  }}
                >
                  Grammar use (Khả năng sử dụng ngữ pháp)
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="1"
                    checked={academicAchievement.grammarUse === "1"}
                    onChange={() => handleAcademicAchievementChange("grammarUse", "1")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="2"
                    checked={academicAchievement.grammarUse === "2"}
                    onChange={() => handleAcademicAchievementChange("grammarUse", "2")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="3"
                    checked={academicAchievement.grammarUse === "3"}
                    onChange={() => handleAcademicAchievementChange("grammarUse", "3")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="4"
                    checked={academicAchievement.grammarUse === "4"}
                    onChange={() => handleAcademicAchievementChange("grammarUse", "4")}
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    fontSize: "14px",
                    color: !isAcademicAchievementSelected("listeningComprehension") ? "#ef4444" : "inherit",
                  }}
                >
                  Listening comprehension (Khả năng nghe hiểu)
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="1"
                    checked={academicAchievement.listeningComprehension === "1"}
                    onChange={() => handleAcademicAchievementChange("listeningComprehension", "1")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="2"
                    checked={academicAchievement.listeningComprehension === "2"}
                    onChange={() => handleAcademicAchievementChange("listeningComprehension", "2")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="3"
                    checked={academicAchievement.listeningComprehension === "3"}
                    onChange={() => handleAcademicAchievementChange("listeningComprehension", "3")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="4"
                    checked={academicAchievement.listeningComprehension === "4"}
                    onChange={() => handleAcademicAchievementChange("listeningComprehension", "4")}
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    fontSize: "14px",
                    color: !isAcademicAchievementSelected("readingComprehension") ? "#ef4444" : "inherit",
                  }}
                >
                  Reading comprehension (Khả năng đọc)
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="1"
                    checked={academicAchievement.readingComprehension === "1"}
                    onChange={() => handleAcademicAchievementChange("readingComprehension", "1")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="2"
                    checked={academicAchievement.readingComprehension === "2"}
                    onChange={() => handleAcademicAchievementChange("readingComprehension", "2")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="3"
                    checked={academicAchievement.readingComprehension === "3"}
                    onChange={() => handleAcademicAchievementChange("readingComprehension", "3")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="4"
                    checked={academicAchievement.readingComprehension === "4"}
                    onChange={() => handleAcademicAchievementChange("readingComprehension", "4")}
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    fontSize: "14px",
                    color: !isAcademicAchievementSelected("writingPerformance") ? "#ef4444" : "inherit",
                  }}
                >
                  Writing performance (Khả năng viết)
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="1"
                    checked={academicAchievement.writingPerformance === "1"}
                    onChange={() => handleAcademicAchievementChange("writingPerformance", "1")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="2"
                    checked={academicAchievement.writingPerformance === "2"}
                    onChange={() => handleAcademicAchievementChange("writingPerformance", "2")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="3"
                    checked={academicAchievement.writingPerformance === "3"}
                    onChange={() => handleAcademicAchievementChange("writingPerformance", "3")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="4"
                    checked={academicAchievement.writingPerformance === "4"}
                    onChange={() => handleAcademicAchievementChange("writingPerformance", "4")}
                  />
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    fontSize: "14px",
                    color: !isAcademicAchievementSelected("speakingConfidence") ? "#ef4444" : "inherit",
                  }}
                >
                  Speaking confidence (Mức độ tự tin khi nói)
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="1"
                    checked={academicAchievement.speakingConfidence === "1"}
                    onChange={() => handleAcademicAchievementChange("speakingConfidence", "1")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="2"
                    checked={academicAchievement.speakingConfidence === "2"}
                    onChange={() => handleAcademicAchievementChange("speakingConfidence", "2")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="3"
                    checked={academicAchievement.speakingConfidence === "3"}
                    onChange={() => handleAcademicAchievementChange("speakingConfidence", "3")}
                  />
                </td>
                <td
                  style={{
                    border: "1px solid #e5e7eb",
                    padding: "4px 8px",
                    textAlign: "center",
                  }}
                >
                  <Radio
                    value="4"
                    checked={academicAchievement.speakingConfidence === "4"}
                    onChange={() => handleAcademicAchievementChange("speakingConfidence", "4")}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
            GENERAL REMARKS
          </div>
          <div
            style={{
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#374151",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
            }}
          >
            {student.result || "-"}
          </div>
        </div>
      </div>
    );
  };

  const handleExportAllDocx = useMemo(() => {
    return async () => {
      if (data.students.length === 0) return;

      try {
        const dateText = data.date ? data.date.format("DD/MM/YYYY") : "";
        const examUpper = data.exam ? data.exam.toUpperCase() : "";

        const getCheckboxValue = (value: string | undefined, index: number) => {
          if (!value) return "〇";
          return parseInt(value) === index ? "✓" : "〇";
        };

        const getStudentData = (student: Student) => {
          const listening = parseFloat(student.listening) || 0;
          const readingWriting = parseFloat(student.reading) || 0;
          const speaking = parseFloat(student.speaking) || 0;
          const total = listening + readingWriting + speaking;
          const remarks = student.remarks || {};
          const academicAchievement = student.academicAchievement || {};

          return {
            name: student.fullName,
            nickName: student.nickName,
            class: data.class,
            date: dateText,
            exam: examUpper,
            teacher: data.teacher,
            // Keep old keys for template compatibility, but only use 3 bands
            vocabulary: "",
            grammar: "",
            listening: student.listening || "",
            reading: student.reading || "",
            writing: "",
            speaking: student.speaking || "",
            totalScore: total,
            result: student.result || "",
            volunteering1: getCheckboxValue(remarks.volunteering, 1),
            volunteering2: getCheckboxValue(remarks.volunteering, 2),
            volunteering3: getCheckboxValue(remarks.volunteering, 3),
            volunteering4: getCheckboxValue(remarks.volunteering, 4),
            participation1: getCheckboxValue(remarks.participation, 1),
            participation2: getCheckboxValue(remarks.participation, 2),
            participation3: getCheckboxValue(remarks.participation, 3),
            participation4: getCheckboxValue(remarks.participation, 4),
            attentiveness1: getCheckboxValue(remarks.attentiveness, 1),
            attentiveness2: getCheckboxValue(remarks.attentiveness, 2),
            attentiveness3: getCheckboxValue(remarks.attentiveness, 3),
            attentiveness4: getCheckboxValue(remarks.attentiveness, 4),
            carefulness1: getCheckboxValue(remarks.carefulness, 1),
            carefulness2: getCheckboxValue(remarks.carefulness, 2),
            carefulness3: getCheckboxValue(remarks.carefulness, 3),
            carefulness4: getCheckboxValue(remarks.carefulness, 4),
            vocabularyRetention1: getCheckboxValue(academicAchievement.vocabularyRetention, 1),
            vocabularyRetention2: getCheckboxValue(academicAchievement.vocabularyRetention, 2),
            vocabularyRetention3: getCheckboxValue(academicAchievement.vocabularyRetention, 3),
            vocabularyRetention4: getCheckboxValue(academicAchievement.vocabularyRetention, 4),
            pronunciation1: getCheckboxValue(academicAchievement.pronunciation, 1),
            pronunciation2: getCheckboxValue(academicAchievement.pronunciation, 2),
            pronunciation3: getCheckboxValue(academicAchievement.pronunciation, 3),
            pronunciation4: getCheckboxValue(academicAchievement.pronunciation, 4),
            grammarUse1: getCheckboxValue(academicAchievement.grammarUse, 1),
            grammarUse2: getCheckboxValue(academicAchievement.grammarUse, 2),
            grammarUse3: getCheckboxValue(academicAchievement.grammarUse, 3),
            grammarUse4: getCheckboxValue(academicAchievement.grammarUse, 4),
            listeningComprehension1: getCheckboxValue(academicAchievement.listeningComprehension, 1),
            listeningComprehension2: getCheckboxValue(academicAchievement.listeningComprehension, 2),
            listeningComprehension3: getCheckboxValue(academicAchievement.listeningComprehension, 3),
            listeningComprehension4: getCheckboxValue(academicAchievement.listeningComprehension, 4),
            readingComprehension1: getCheckboxValue(academicAchievement.readingComprehension, 1),
            readingComprehension2: getCheckboxValue(academicAchievement.readingComprehension, 2),
            readingComprehension3: getCheckboxValue(academicAchievement.readingComprehension, 3),
            readingComprehension4: getCheckboxValue(academicAchievement.readingComprehension, 4),
            writingPerformance1: getCheckboxValue(academicAchievement.writingPerformance, 1),
            writingPerformance2: getCheckboxValue(academicAchievement.writingPerformance, 2),
            writingPerformance3: getCheckboxValue(academicAchievement.writingPerformance, 3),
            writingPerformance4: getCheckboxValue(academicAchievement.writingPerformance, 4),
            speakingConfidence1: getCheckboxValue(academicAchievement.speakingConfidence, 1),
            speakingConfidence2: getCheckboxValue(academicAchievement.speakingConfidence, 2),
            speakingConfidence3: getCheckboxValue(academicAchievement.speakingConfidence, 3),
            speakingConfidence4: getCheckboxValue(academicAchievement.speakingConfidence, 4),
          };
        };

        const response = await fetch("/template-report.docx");
        const arrayBuffer = await response.arrayBuffer();
        const baseZip = new PizZip(arrayBuffer);

        const doc = new Docxtemplater(baseZip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        doc.setData(getStudentData(data.students[0]));
        doc.render();

        const baseZipAfterRender = doc.getZip();
        const baseDocumentXml = baseZipAfterRender.files["word/document.xml"].asText();
        const parser = new DOMParser();
        const baseDoc = parser.parseFromString(baseDocumentXml, "text/xml");
        const baseBody = baseDoc.querySelector("w\\:body, body");

        if (data.students.length > 1) {
          for (let i = 1; i < data.students.length; i++) {
            const studentZip = new PizZip(arrayBuffer);
            const studentDoc = new Docxtemplater(studentZip, {
              paragraphLoop: true,
              linebreaks: true,
            });

            studentDoc.setData(getStudentData(data.students[i]));
            studentDoc.render();

            const studentZipAfterRender = studentDoc.getZip();
            const studentDocumentXml = studentZipAfterRender.files["word/document.xml"].asText();
            const studentDocParsed = parser.parseFromString(studentDocumentXml, "text/xml");
            const studentBody = studentDocParsed.querySelector("w\\:body, body");

            if (baseBody && studentBody) {
              const pageBreak = baseDoc.createElementNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "w:p");
              const pPr = baseDoc.createElementNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "w:pPr");
              const sectPr = baseDoc.createElementNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "w:sectPr");
              pPr.appendChild(sectPr);
              pageBreak.appendChild(pPr);
              baseBody.appendChild(pageBreak);

              const studentBodyChildren = Array.from(studentBody.childNodes);
              studentBodyChildren.forEach((child) => {
                if (child.nodeType === 1) {
                  const importedNode = baseDoc.importNode(child, true);
                  baseBody.appendChild(importedNode);
                }
              });
            }
          }

          const serializer = new XMLSerializer();
          const mergedDocumentXml = serializer.serializeToString(baseDoc);
          baseZipAfterRender.file("word/document.xml", mergedDocumentXml);
        }

        const blob = baseZipAfterRender.generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          compression: "DEFLATE",
        });

        const fileName = `${data.class} - ${examUpper} REPORT.docx`;
        saveAs(blob, fileName);
      } catch (error) {
        console.error("Error exporting DOCX:", error);
        alert("Có lỗi xảy ra khi xuất file DOCX");
      }
    };
  }, [data]);

  const endIndex = Math.min(currentIndex + cardsPerPage, totalStudents);
  const counterText = `${endIndex}/${totalStudents}`;

  const headerCenterContentMemo = useMemo(() => {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginLeft: "-15px", height: "100%" }}>
        <Button
          icon={<LeftOutlined />}
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          style={{ display: "flex", alignItems: "center" }}
        >
        </Button>
        <div style={{ fontSize: "16px", fontWeight: 500, lineHeight: "56px", display: "flex", alignItems: "center" }}>
          {counterText}
        </div>
        <Button
          icon={<RightOutlined />}
          onClick={handleNext}
          disabled={currentIndex + cardsPerPage >= totalStudents}
          style={{ display: "flex", alignItems: "center" }}
        >
        </Button>
      </div>
    );
  }, [handlePrevious, handleNext, currentIndex, cardsPerPage, totalStudents, counterText]);

  useEffect(() => {
    setShowFooter(true);
    setFooterLeftText("Step 2: Word Report");
    setFooterLeftAction(null);
    setFooterAction({
      text: "Back to Step 1",
      onClick: onBackStep || (() => {}),
      leftButton: {
        text: "Export",
        icon: <DownloadOutlined />,
        onClick: handleExportAllDocx,
      },
    });
    setHeaderCenterContent(headerCenterContentMemo);

    return () => {
      setShowFooter(false);
      setFooterAction(null);
      setFooterLeftText(null);
      setFooterLeftAction(null);
      setHeaderCenterContent(null);
    };
  }, [setShowFooter, setFooterAction, setFooterLeftText, setFooterLeftAction, setHeaderCenterContent, onBackStep, handleExportAllDocx, headerCenterContentMemo]);

  const handleExportDocx = async (student: Student) => {
    try {
      const response = await fetch("/template-report.docx");
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [],
      });

      const dateText = data.date ? data.date.format("DD/MM/YYYY") : "";
      const listening = parseFloat(student.listening) || 0;
      const readingWriting = parseFloat(student.reading) || 0;
      const speaking = parseFloat(student.speaking) || 0;
      const total = listening + readingWriting + speaking;

      const remarks = student.remarks || {};
      const academicAchievement = student.academicAchievement || {};

      const getCheckboxValue = (value: string | undefined, index: number) => {
        if (!value) return "〇";
        return parseInt(value) === index ? "✓" : "〇";
      };

      doc.setData({
        name: student.fullName,
        nickName: student.nickName,
        class: data.class,
        date: dateText,
        exam: data.exam ? data.exam.toUpperCase() : "",
        teacher: data.teacher,
        // Keep old keys for template compatibility, but only use 3 bands
        vocabulary: "",
        grammar: "",
        listening: student.listening || "",
        reading: student.reading || "",
        writing: "",
        speaking: student.speaking || "",
        totalScore: total,
        result: student.result || "",
        volunteering1: getCheckboxValue(remarks.volunteering, 1),
        volunteering2: getCheckboxValue(remarks.volunteering, 2),
        volunteering3: getCheckboxValue(remarks.volunteering, 3),
        volunteering4: getCheckboxValue(remarks.volunteering, 4),
        participation1: getCheckboxValue(remarks.participation, 1),
        participation2: getCheckboxValue(remarks.participation, 2),
        participation3: getCheckboxValue(remarks.participation, 3),
        participation4: getCheckboxValue(remarks.participation, 4),
        attentiveness1: getCheckboxValue(remarks.attentiveness, 1),
        attentiveness2: getCheckboxValue(remarks.attentiveness, 2),
        attentiveness3: getCheckboxValue(remarks.attentiveness, 3),
        attentiveness4: getCheckboxValue(remarks.attentiveness, 4),
        carefulness1: getCheckboxValue(remarks.carefulness, 1),
        carefulness2: getCheckboxValue(remarks.carefulness, 2),
        carefulness3: getCheckboxValue(remarks.carefulness, 3),
        carefulness4: getCheckboxValue(remarks.carefulness, 4),
        vocabularyRetention1: getCheckboxValue(academicAchievement.vocabularyRetention, 1),
        vocabularyRetention2: getCheckboxValue(academicAchievement.vocabularyRetention, 2),
        vocabularyRetention3: getCheckboxValue(academicAchievement.vocabularyRetention, 3),
        vocabularyRetention4: getCheckboxValue(academicAchievement.vocabularyRetention, 4),
        pronunciation1: getCheckboxValue(academicAchievement.pronunciation, 1),
        pronunciation2: getCheckboxValue(academicAchievement.pronunciation, 2),
        pronunciation3: getCheckboxValue(academicAchievement.pronunciation, 3),
        pronunciation4: getCheckboxValue(academicAchievement.pronunciation, 4),
        grammarUse1: getCheckboxValue(academicAchievement.grammarUse, 1),
        grammarUse2: getCheckboxValue(academicAchievement.grammarUse, 2),
        grammarUse3: getCheckboxValue(academicAchievement.grammarUse, 3),
        grammarUse4: getCheckboxValue(academicAchievement.grammarUse, 4),
        listeningComprehension1: getCheckboxValue(academicAchievement.listeningComprehension, 1),
        listeningComprehension2: getCheckboxValue(academicAchievement.listeningComprehension, 2),
        listeningComprehension3: getCheckboxValue(academicAchievement.listeningComprehension, 3),
        listeningComprehension4: getCheckboxValue(academicAchievement.listeningComprehension, 4),
        readingComprehension1: getCheckboxValue(academicAchievement.readingComprehension, 1),
        readingComprehension2: getCheckboxValue(academicAchievement.readingComprehension, 2),
        readingComprehension3: getCheckboxValue(academicAchievement.readingComprehension, 3),
        readingComprehension4: getCheckboxValue(academicAchievement.readingComprehension, 4),
        writingPerformance1: getCheckboxValue(academicAchievement.writingPerformance, 1),
        writingPerformance2: getCheckboxValue(academicAchievement.writingPerformance, 2),
        writingPerformance3: getCheckboxValue(academicAchievement.writingPerformance, 3),
        writingPerformance4: getCheckboxValue(academicAchievement.writingPerformance, 4),
        speakingConfidence1: getCheckboxValue(academicAchievement.speakingConfidence, 1),
        speakingConfidence2: getCheckboxValue(academicAchievement.speakingConfidence, 2),
        speakingConfidence3: getCheckboxValue(academicAchievement.speakingConfidence, 3),
        speakingConfidence4: getCheckboxValue(academicAchievement.speakingConfidence, 4),
      });

      doc.render();

      const blob = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE",
      });

      const fileName = `${data.class} - ${student.fullName} - ${data.exam} REPORT.docx`;
      saveAs(blob, fileName);
    } catch (error) {
      console.error("Error exporting DOCX:", error);
      alert("Có lỗi xảy ra khi xuất file DOCX");
    }
  };

  return (
    <ContentLayout>
      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "24px",
          }}
        >
          {currentStudents.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      </div>
    </ContentLayout>
  );
};
