"use client";

import { useState, useEffect, useCallback } from "react";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import type { EucReportData, Student } from "../types";

const STORAGE_KEY = "euc-report-data";

export function useEucReport() {
  const [data, setData] = useState<EucReportData>({
    date: null,
    exam: "",
    class: "",
    teacher: "NTV",
    students: [],
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData({
          ...parsed,
          date: parsed.date ? dayjs(parsed.date) : null,
          teacher: parsed.teacher || "NTV",
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
    setData((prevData) => {
      return { ...prevData, date };
    });
  }, []);

  const updateExam = useCallback((exam: string) => {
    setData((prevData) => {
      return { ...prevData, exam };
    });
  }, []);

  const updateClass = useCallback((classValue: string) => {
    setData((prevData) => {
      return { ...prevData, class: classValue };
    });
  }, []);

  const updateTeacher = useCallback((teacher: string) => {
    setData((prevData) => {
      return { ...prevData, teacher };
    });
  }, []);

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
        vocabulary: "",
        grammar: "",
        listening: "",
        reading: "",
        writing: "",
        speaking: "",
        title: "",
        result: "",
      };
      const newData = { ...prevData, students: [...prevData.students, newStudent] };
      // Save immediately for add/delete operations
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
      // Save immediately for add/delete operations
      saveDataToStorage(newData);
      return newData;
    });
  }, [saveDataToStorage]);

  const importStudents = useCallback((students: Student[]) => {
    setData((prevData) => {
      const newData = { ...prevData, students: [...prevData.students, ...students] };
      // Save immediately for import operations
      saveDataToStorage(newData);
      return newData;
    });
  }, [saveDataToStorage]);

  const clearStudents = useCallback(() => {
    setData((prevData) => {
      const newData = { ...prevData, students: [] };
      // Save immediately for clear operations
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
    addStudent,
    updateStudent,
    deleteStudent,
    importStudents,
    clearStudents,
    saveCurrentData,
  };
}
