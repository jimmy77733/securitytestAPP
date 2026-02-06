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
  getRandomQuestions: (bank: QuestionBank | string, count: number) => Question[];
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

      getRandomQuestions: (bank, count) => {
        const questions = get().questionBanks[bank] || [];
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
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

