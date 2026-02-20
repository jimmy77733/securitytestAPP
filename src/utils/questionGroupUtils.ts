import type { Question } from '@/types';

/**
 * 依題目產出題組內容的唯一鍵，確保同一題庫、同一科目、同一年份的題組才對應。
 * 用於判定要顯示哪一個題組內容，避免不同科目或不同年份的題組互相錯用。
 */
export function getQuestionGroupKey(q: Question): string {
  const bank = q.questionBank ?? '';
  const category = q.category ?? '';
  const year = q.year ?? '';
  const groupId = q.questionGroupId ?? '';
  return `${bank}_${category}_${year}_${groupId}`.replace(/_+$/, '');
}

/**
 * 判斷題目是否為題組題（有 questionGroupId 且可組成有效 groupKey）
 */
export function isQuestionGroupQuestion(q: Question): boolean {
  return Boolean(q.questionGroupId && q.questionBank && q.category != null && q.year != null);
}
