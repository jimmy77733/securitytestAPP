// 自動生成的題庫載入代碼
// 此文件由腳本自動生成，請勿手動修改

import { loadQuestionBank } from '@/utils/questionLoader';
import type { Question } from '@/types';

// 初級題庫
const primaryQuestions: Question[] = [];

// 中級題庫
const intermediateQuestions: Question[] = [];

// 載入題庫
export function loadAllQuestionBanks() {
  loadQuestionBank('primary', primaryQuestions);
  loadQuestionBank('intermediate', intermediateQuestions);
  console.log('題庫載入完成:', {
    primary: primaryQuestions.length,
    intermediate: intermediateQuestions.length,
  });
}

// 導出題目數據（供開發使用）
export { primaryQuestions, intermediateQuestions };
