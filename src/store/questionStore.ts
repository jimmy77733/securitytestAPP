import { create } from 'zustand';
import type { Question, QuestionBank } from '@/types';

interface QuestionState {
  questions: Question[];
  questionBanks: {
    primary: Question[];
    intermediate: Question[];
  };
  
  // Actions
  loadQuestions: (bank: QuestionBank, questions: Question[]) => void;
  getQuestions: (bank: QuestionBank) => Question[];
  getRandomQuestions: (bank: QuestionBank, count: number) => Question[];
}

export const useQuestionStore = create<QuestionState>((set, get) => ({
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
}));

