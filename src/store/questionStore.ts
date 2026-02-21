import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Question, QuestionBank, QuestionGroupContent } from '@/types';

interface QuestionState {
  questions: Question[];
  questionBanks: {
    primary: Question[];
    intermediate: Question[];
    [key: string]: Question[]; // 支援自定義題庫
  };
  /** 題組內容（依 groupKey 對應），不持久化，由題庫載入時填入 */
  questionGroupsMap: Record<string, QuestionGroupContent>;

  // Actions
  loadQuestions: (bank: QuestionBank | string, questions: Question[]) => void;
  loadQuestionGroups: (groups: QuestionGroupContent[]) => void;
  getQuestions: (bank: QuestionBank | string) => Question[];
  getQuestionGroupContent: (groupKey: string) => QuestionGroupContent | undefined;
  getRandomQuestions: (bank: QuestionBank | string, count: number, yearFilter?: string, categoryFilter?: string, shuffle?: boolean) => Question[];
  getAvailableYears: (bank: QuestionBank | string) => string[];
  getAvailableCategories: (bank: QuestionBank | string) => string[];
  getAllBanks: () => string[];
}

export const useQuestionStore = create<QuestionState>()(
  persist(
    (set, get) => ({
      questions: [],
      questionBanks: {
        primary: [],
        intermediate: [],
      },
      questionGroupsMap: {},

      loadQuestions: (bank, questions) => {
        set((state) => ({
          questionBanks: {
            ...state.questionBanks,
            [bank]: questions,
          },
          questions: [...state.questions, ...questions],
        }));
      },

      loadQuestionGroups: (groups) => {
        if (!groups.length) return;
        set((state) => {
          const next = { ...state.questionGroupsMap };
          groups.forEach((g) => {
            next[g.groupKey] = g;
          });
          return { questionGroupsMap: next };
        });
      },

      getQuestionGroupContent: (groupKey) => {
        return get().questionGroupsMap[groupKey];
      },

      getQuestions: (bank) => {
        return get().questionBanks[bank] || [];
      },

      getRandomQuestions: (bank, count, yearFilter, categoryFilter, shuffle = true) => {
        let questions = get().questionBanks[bank] || [];
        if (yearFilter && yearFilter !== '') {
          questions = questions.filter((q) => q.year === yearFilter);
        }
        if (categoryFilter && categoryFilter !== '') {
          questions = questions.filter((q) => q.category === categoryFilter);
        }
        const list = shuffle ? [...questions].sort(() => Math.random() - 0.5) : [...questions];
        return list.slice(0, Math.min(count, list.length));
      },

      getAvailableYears: (bank) => {
        const questions = get().questionBanks[bank] || [];
        const years = new Set(questions.map((q) => q.year).filter(Boolean) as string[]);
        return Array.from(years).sort();
      },

      getAvailableCategories: (bank) => {
        const questions = get().questionBanks[bank] || [];
        const categories = new Set(questions.map((q) => q.category).filter(Boolean) as string[]);
        return Array.from(categories).sort();
      },

      getAllBanks: () => {
        return Object.keys(get().questionBanks);
      },
    }),
    {
      name: 'question-storage',
      partialize: (state) => ({ questionBanks: state.questionBanks }),
    }
  )
);

