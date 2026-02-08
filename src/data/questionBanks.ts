/**
 * 題庫載入：從 src/data/banks/*.json 依前贅詞分檔載入
 * 執行 npm run load-questions 會將驗證後的題目寫入 banks/*.json，本檔僅負責載入
 */

import { loadQuestionBank } from '@/utils/questionLoader';
import type { Question } from '@/types';

type BankModule = { default: Question[] };

const bankModules = (import.meta as unknown as { glob: (p: string, o?: { eager?: boolean }) => Record<string, BankModule> }).glob(
  './banks/*.json',
  { eager: true }
);

function loadAllQuestionBanks(): void {
  const allQuestions: Question[] = [];

  for (const key of Object.keys(bankModules)) {
    const mod = (bankModules as Record<string, BankModule>)[key];
    const list = Array.isArray((mod as { default?: Question[] })?.default)
      ? (mod as { default: Question[] }).default
      : Array.isArray(mod)
        ? (mod as unknown as Question[])
        : [];
    if (list.length) {
      allQuestions.push(...list);
    }
  }

  const primary = allQuestions.filter((q) => q.questionBank === 'primary');
  const intermediate = allQuestions.filter((q) => q.questionBank === 'intermediate');

  loadQuestionBank('primary', primary);
  loadQuestionBank('intermediate', intermediate);

  console.log('題庫載入完成:', {
    primary: primary.length,
    intermediate: intermediate.length,
  });
}

export { loadAllQuestionBanks };
