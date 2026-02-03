import { Dayjs } from "dayjs";

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
  vocabulary: string;
  grammar: string;
  listening: string;
  reading: string;
  writing: string;
  speaking: string;
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
  students: Student[];
}

export interface EucReportFormData {
  date: string | null;
  class: string;
  teacher: string;
  students: Student[];
}
