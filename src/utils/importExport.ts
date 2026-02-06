import type { Question, QuestionBank } from '@/types';
import { useQuestionStore } from '@/store/questionStore';

/**
 * 匯入題庫
 * @param questions 要匯入的題目陣列
 * @param targetBank 目標題庫
 * @returns 匯入結果
 */
export function importQuestions(
  questions: Question[],
  targetBank: QuestionBank | string
): {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
} {
  const { getQuestions, loadQuestions } = useQuestionStore.getState();
  const existingQuestions = getQuestions(targetBank as QuestionBank);
  const existingIds = new Set(existingQuestions.map((q) => q.id));

  const result = {
    success: 0,
    failed: 0,
    duplicates: 0,
    errors: [] as string[],
  };

  const newQuestions: Question[] = [];
  const duplicateIds: string[] = [];

  questions.forEach((question, index) => {
    // 驗證題目格式
    if (!question.id) {
      result.failed++;
      result.errors.push(`題目 ${index + 1}: 缺少ID`);
      return;
    }

    if (!question.question || question.question.length < 5) {
      result.failed++;
      result.errors.push(`題目 ${index + 1}: 題目文字過短或缺失`);
      return;
    }

    if (!question.options || question.options.length < 2) {
      result.failed++;
      result.errors.push(`題目 ${index + 1}: 選項不足（至少需要2個）`);
      return;
    }

    if (!question.correctAnswers || question.correctAnswers.length === 0) {
      result.failed++;
      result.errors.push(`題目 ${index + 1}: 缺少正確答案`);
      return;
    }

    // 檢查ID是否重複
    if (existingIds.has(question.id)) {
      result.duplicates++;
      duplicateIds.push(question.id);
      return; // 跳過重複的題目
    }

    // 驗證答案是否在選項中
    const optionIds = new Set(question.options.map((opt) => opt.id));
    const invalidAnswers = question.correctAnswers.filter(
      (ansId) => !optionIds.has(ansId)
    );

    if (invalidAnswers.length > 0) {
      result.failed++;
      result.errors.push(
        `題目 ${index + 1}: 答案 ${invalidAnswers.join(', ')} 不在選項中`
      );
      return;
    }

    // 更新題庫類型
    const validQuestion: Question = {
      ...question,
      questionBank: targetBank as QuestionBank,
    };

    newQuestions.push(validQuestion);
    existingIds.add(question.id);
    result.success++;
  });

  // 載入新題目
  if (newQuestions.length > 0) {
    const allQuestions = [...existingQuestions, ...newQuestions];
    loadQuestions(targetBank as QuestionBank, allQuestions);
  }

  if (duplicateIds.length > 0) {
    result.errors.push(
      `跳過 ${result.duplicates} 個重複的題目ID: ${duplicateIds.slice(0, 5).join(', ')}${duplicateIds.length > 5 ? '...' : ''}`
    );
  }

  return result;
}

/**
 * 匯出題庫
 * @param bank 題庫類型
 * @returns JSON字符串
 */
export function exportQuestions(bank: QuestionBank | string): string {
  const { getQuestions } = useQuestionStore.getState();
  const questions = getQuestions(bank as QuestionBank);

  return JSON.stringify(questions, null, 2);
}

/**
 * 從文件讀取JSON
 */
export function readJsonFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        resolve(data);
      } catch (error) {
        reject(new Error('無法解析JSON文件'));
      }
    };
    reader.onerror = () => reject(new Error('讀取文件失敗'));
    reader.readAsText(file);
  });
}

