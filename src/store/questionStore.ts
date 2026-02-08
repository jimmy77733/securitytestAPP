import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Question, QuestionBank } from '@/types';

interface QuestionState {
  questions: Question[];
  questionBanks: {
    primary: Question[];
    intermediate: Question[];
    [key: string]: Question[]; // 支援自定義題庫
  };
  
  // Actions
  loadQuestions: (bank: QuestionBank | string, questions: Question[]) => void;
  getQuestions: (bank: QuestionBank | string) => Question[];
  getRandomQuestions: (bank: QuestionBank | string, count: number, yearFilter?: string, categoryFilter?: string) => Question[];
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

      loadQuestions: (bank, questions) => {
        set((state) => ({
          questionBanks: {
            ...state.questionBanks,
            [bank]: questions,
          },
          questions: [...state.questions, ...questions],
        }));
      },

      getQuestions: (bank) => {
        return get().questionBanks[bank] || [];
      },

      getRandomQuestions: (bank, count, yearFilter, categoryFilter) => {
        let questions = get().questionBanks[bank] || [];
        if (yearFilter && yearFilter !== '') {
          questions = questions.filter((q) => q.year === yearFilter);
        }
        if (categoryFilter && categoryFilter !== '') {
          questions = questions.filter((q) => q.category === categoryFilter);
        }
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
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
    }
  )
);

