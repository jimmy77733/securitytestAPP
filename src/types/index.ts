// 題型定義
export type QuestionType = 'single' | 'multiple';

// 測驗模式
export type TestMode = 'exam' | 'training';

// 題庫類型
export type QuestionBank = 'primary' | 'intermediate';

// 使用者資料
export interface User {
  id: string;
  name: string;
  createdAt: string;
}

// 選項
export interface Option {
  id: string;
  text: string;
}

// 題目
export interface Question {
  id: string;
  questionBank: QuestionBank;
  type: QuestionType;
  question: string;
  options: Option[];
  correctAnswers: string[]; // 正確答案的ID陣列
  explanation?: string;
  year?: string;
  category?: string;
}

// 使用者答案
export interface UserAnswer {
  questionId: string;
  selectedOptions: string[];
  isCorrect: boolean;
  answeredAt: string;
  /** 未作答（提早交卷或未選答案） */
  unanswered?: boolean;
}

// 測驗記錄
export interface TestRecord {
  id: string;
  userId: string;
  questionBank: QuestionBank;
  mode: TestMode;
  questions: Question[];
  answers: UserAnswer[];
  score: number;
  totalQuestions: number;
  correctCount: number;
  duration: number; // 秒數
  completedAt: string;
  passed: boolean; // 是否及格（60分以上）
}

// 收藏題目
export interface FavoriteQuestion {
  id: string;
  userId: string;
  questionId: string;
  question: Question;
  favoritedAt: string;
}

