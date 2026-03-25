import { Dayjs } from "dayjs";

export interface ReportScoreColumn {
  id: string;
  fieldName: string;
  maxPoint: number;
}

export interface StudentRemarks {
  volunteering?: string;
  participation?: string;
  attentiveness?: string;
  carefulness?: string;
}

export interface StudentAcademicAchievement {
  vocabularyRetention?: string;
  pronunciation?: string;
  grammarUse?: string;
  listeningComprehension?: string;
  readingComprehension?: string;
  writingPerformance?: string;
  speakingConfidence?: string;
}

export interface Student {
  id: string;
  fullName: string;
  nickName: string;
  /** Score values keyed by ReportScoreColumn.id */
  scores: Record<string, string>;
  title: string;
  result: string;
  remarks?: StudentRemarks;
  academicAchievement?: StudentAcademicAchievement;
}

export interface EucReportData {
  date: Dayjs | null;
  exam: string;
  class: string;
  teacher: string;
  scoreColumns: ReportScoreColumn[];
  students: Student[];
}

export interface EucReportFormData {
  date: string | null;
  class: string;
  teacher: string;
  students: Student[];
}
