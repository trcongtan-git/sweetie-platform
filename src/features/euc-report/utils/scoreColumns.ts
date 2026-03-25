import type { EucReportData, ReportScoreColumn, Student } from "../types";

export const DEFAULT_SCORE_COLUMNS: ReportScoreColumn[] = [
  { id: "listening", fieldName: "Listening", maxPoint: 25 },
  { id: "reading", fieldName: "Reading & Writing", maxPoint: 50 },
  { id: "speaking", fieldName: "Speaking", maxPoint: 25 },
];

export function getStudentScoreTotal(
  student: Student,
  columns: ReportScoreColumn[]
): number {
  return columns.reduce((sum, col) => {
    return sum + (parseFloat(student.scores[col.id]) || 0);
  }, 0);
}

export function ensureStudentScores(
  student: Student,
  columns: ReportScoreColumn[]
): Student {
  const scores: Record<string, string> = { ...student.scores };
  for (const col of columns) {
    if (scores[col.id] === undefined) scores[col.id] = "";
  }
  return { ...student, scores };
}

export function emptyScoresForColumns(
  columns: ReportScoreColumn[]
): Record<string, string> {
  return Object.fromEntries(columns.map((c) => [c.id, ""]));
}

/** Migrate one student from legacy flat score fields to scores map */
export function migrateStudentRecord(raw: Record<string, unknown>): Student {
  const base = raw as Partial<Student> & {
    listeningPer?: string;
    vocabulary?: string;
    grammar?: string;
    listening?: string;
    reading?: string;
    writing?: string;
    speaking?: string;
  };

  let scores: Record<string, string> =
    base.scores && typeof base.scores === "object" && !Array.isArray(base.scores)
      ? { ...(base.scores as Record<string, string>) }
      : {};

  if (Object.keys(scores).length === 0) {
    scores = {
      listening: base.listening != null ? String(base.listening) : "",
      reading: base.reading != null ? String(base.reading) : "",
      speaking: base.speaking != null ? String(base.speaking) : "",
    };
  }

  return {
    id: String(base.id ?? `${Date.now()}`),
    fullName: String(base.fullName ?? ""),
    nickName: String(base.nickName ?? ""),
    scores,
    title: String(base.title ?? ""),
    result: String(base.result ?? ""),
    remarks: base.remarks,
    academicAchievement: base.academicAchievement,
  };
}

export function normalizeEucReportPayload(parsed: Record<string, unknown>): Omit<
  EucReportData,
  "date"
> & { date: string | null } {
  let scoreColumns: ReportScoreColumn[] = DEFAULT_SCORE_COLUMNS;
  const rawCols = parsed.scoreColumns;
  if (Array.isArray(rawCols) && rawCols.length > 0) {
    scoreColumns = rawCols
      .filter(
        (c): c is Record<string, unknown> =>
          c != null &&
          typeof c === "object" &&
          typeof (c as Record<string, unknown>).id === "string" &&
          typeof (c as Record<string, unknown>).fieldName === "string"
      )
      .map((c) => ({
        id: String(c.id),
        fieldName: String(c.fieldName),
        maxPoint: Math.max(0, Number(c.maxPoint) || 0),
      }));
    if (scoreColumns.length === 0) scoreColumns = DEFAULT_SCORE_COLUMNS;
  }

  const rawStudents = Array.isArray(parsed.students) ? parsed.students : [];
  let students = rawStudents.map((s) =>
    migrateStudentRecord(s as Record<string, unknown>)
  );

  students = students.map((s) => ensureStudentScores(s, scoreColumns));

  return {
    date: (parsed.date as string | null) ?? null,
    exam: String(parsed.exam ?? ""),
    class: String(parsed.class ?? ""),
    teacher: String(parsed.teacher ?? "NTV"),
    scoreColumns,
    students,
  };
}

export function rekeyStudentScores(
  student: Student,
  newColumns: ReportScoreColumn[]
): Student {
  const next: Record<string, string> = {};
  for (const col of newColumns) {
    next[col.id] = student.scores[col.id] ?? "";
  }
  return { ...student, scores: next };
}

/**
 * Merge vào docxtemplater sau khi patch bảng điểm trong document.xml:
 * gradeHdrN (uppercased field name only), gradeValN, gradeMaxN, gradeTotalMax, totalScore + legacy 3 cột đầu.
 */
export function buildDocxDynamicScores(student: Student, report: EucReportData) {
  const columns = report.scoreColumns;
  const totalRaw = getStudentScoreTotal(student, columns);
  const totalScore = totalRaw % 1 === 0 ? totalRaw : Number(totalRaw.toFixed(1));
  const gradeTotalMax = columns.reduce((sum, c) => sum + c.maxPoint, 0);
  const scoreRows = columns.map((col) => ({
    label: col.fieldName,
    value: student.scores[col.id] || "",
    max: col.maxPoint,
  }));

  const dynamic: Record<string, string | number | typeof scoreRows> = {
    listening: student.scores[columns[0]?.id] || "",
    readingWriting: student.scores[columns[1]?.id] || "",
    speaking: student.scores[columns[2]?.id] || "",
    totalScore,
    gradeTotalMax,
    scoreRows,
  };

  columns.forEach((col, i) => {
    dynamic[`gradeHdr${i}`] = col.fieldName.toUpperCase();
    dynamic[`gradeVal${i}`] = student.scores[col.id] || "";
    dynamic[`gradeMax${i}`] = String(col.maxPoint);
  });

  return dynamic;
}
