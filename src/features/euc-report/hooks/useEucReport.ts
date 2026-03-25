"use client";

import { useState, useEffect, useCallback } from "react";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type { EucReportData, ReportScoreColumn, Student } from "../types";
import {
  DEFAULT_SCORE_COLUMNS,
  emptyScoresForColumns,
  normalizeEucReportPayload,
  rekeyStudentScores,
} from "../utils/scoreColumns";

const STORAGE_KEY = "euc-report-data";

const initialData = (): EucReportData => ({
  date: null,
  exam: "",
  class: "",
  teacher: "NTV",
  scoreColumns: DEFAULT_SCORE_COLUMNS,
  students: [],
});

export function useEucReport() {
  const [data, setData] = useState<EucReportData>(initialData);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Record<string, unknown>;
        const normalized = normalizeEucReportPayload(parsed);
        setData({
          ...normalized,
          date: normalized.date ? dayjs(normalized.date) : null,
          teacher: normalized.teacher || "NTV",
        });
      } catch (error) {
        console.error("Failed to load saved data:", error);
      }
    }
  }, []);

  const saveDataToStorage = useCallback((dataToSave: EucReportData) => {
    const toSave = {
      ...dataToSave,
      date: dataToSave.date ? dataToSave.date.toISOString() : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, []);

  const updateDate = useCallback((date: Dayjs | null) => {
    setData((prevData) => ({ ...prevData, date }));
  }, []);

  const updateExam = useCallback((exam: string) => {
    setData((prevData) => ({ ...prevData, exam }));
  }, []);

  const updateClass = useCallback((classValue: string) => {
    setData((prevData) => ({ ...prevData, class: classValue }));
  }, []);

  const updateTeacher = useCallback((teacher: string) => {
    setData((prevData) => ({ ...prevData, teacher }));
  }, []);

  const updateScoreColumns = useCallback(
    (scoreColumns: ReportScoreColumn[]) => {
      setData((prev) => {
        const students = prev.students.map((s) =>
          rekeyStudentScores(s, scoreColumns)
        );
        const newData = { ...prev, scoreColumns, students };
        saveDataToStorage(newData);
        return newData;
      });
    },
    [saveDataToStorage]
  );

  const saveCurrentData = useCallback(() => {
    setData((currentData) => {
      saveDataToStorage(currentData);
      return currentData;
    });
  }, [saveDataToStorage]);

  const addStudent = useCallback(() => {
    setData((prevData) => {
      const newStudent: Student = {
        id: Date.now().toString(),
        fullName: "",
        nickName: "",
        scores: emptyScoresForColumns(prevData.scoreColumns),
        title: "",
        result: "",
      };
      const newData = {
        ...prevData,
        students: [...prevData.students, newStudent],
      };
      saveDataToStorage(newData);
      return newData;
    });
  }, [saveDataToStorage]);

  const updateStudent = useCallback((id: string, updates: Partial<Student>) => {
    setData((prevData) => {
      const updatedStudents = prevData.students.map((student) =>
        student.id === id ? { ...student, ...updates } : student
      );
      return { ...prevData, students: updatedStudents };
    });
  }, []);

  const deleteStudent = useCallback((id: string) => {
    setData((prevData) => {
      const updatedStudents = prevData.students.filter((student) => student.id !== id);
      const newData = { ...prevData, students: updatedStudents };
      saveDataToStorage(newData);
      return newData;
    });
  }, [saveDataToStorage]);

  const importStudents = useCallback((students: Student[]) => {
    setData((prevData) => {
      const filled = students.map((s) => rekeyStudentScores(s, prevData.scoreColumns));
      const newData = { ...prevData, students: [...prevData.students, ...filled] };
      saveDataToStorage(newData);
      return newData;
    });
  }, [saveDataToStorage]);

  const clearStudents = useCallback(() => {
    setData((prevData) => {
      const newData = { ...prevData, students: [] };
      saveDataToStorage(newData);
      return newData;
    });
  }, [saveDataToStorage]);

  return {
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
  };
}
