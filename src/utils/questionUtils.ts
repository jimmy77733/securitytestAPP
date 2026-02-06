import type { Question, QuestionType } from '@/types';

/**
 * 檢查答案是否正確
 */
export function checkAnswer(
  question: Question,
  selectedOptions: string[]
): boolean {
  const correctAnswers = question.correctAnswers.sort();
  const selected = [...selectedOptions].sort();
  
  if (correctAnswers.length !== selected.length) {
    return false;
  }
  
  return correctAnswers.every((id, index) => id === selected[index]);
}

/**
 * 判斷題型（單選或多選）
 */
export function detectQuestionType(
  correctAnswersCount: number
): QuestionType {
  return correctAnswersCount === 1 ? 'single' : 'multiple';
}

/**
 * 格式化時間（秒數轉為 MM:SS）
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

