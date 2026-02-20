/**
 * 題庫載入：從 src/data/banks/*.json 依前贅詞分檔載入
 * 執行 npm run load-questions 會將驗證後的題目寫入 banks/*.json，本檔僅負責載入
 * 支援格式：陣列 Question[] 或 { questions: Question[], questionGroups?: QuestionGroupContent[] }
 */

import { loadQuestionBank } from '@/utils/questionLoader';
import { useQuestionStore } from '@/store/questionStore';
import type { Question, QuestionGroupContent } from '@/types';

type BankModule = { default: Question[] | { questions: Question[]; questionGroups?: QuestionGroupContent[] } };

const bankModules = (import.meta as unknown as { glob: (p: string, o?: { eager?: boolean }) => Record<string, BankModule> }).glob(
  './banks/*.json',
  { eager: true }
);

function loadAllQuestionBanks(): void {
  const allQuestions: Question[] = [];
  const { loadQuestionGroups } = useQuestionStore.getState();

  for (const key of Object.keys(bankModules)) {
    const mod = (bankModules as Record<string, BankModule>)[key];
    const raw = (mod as { default: Question[] | { questions: Question[]; questionGroups?: QuestionGroupContent[] } })?.default;
    let list: Question[];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (raw && typeof raw === 'object' && Array.isArray(raw.questions)) {
      list = raw.questions;
      if (raw.questionGroups?.length) {
        loadQuestionGroups(raw.questionGroups);
      }
    } else {
      list = [];
    }
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
