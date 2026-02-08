import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TestRecord, Question, UserAnswer, TestMode, QuestionBank } from '@/types';

interface TestState {
  currentTest: {
    mode: TestMode;
    questionBank: QuestionBank;
    questions: Question[];
    currentQuestionIndex: number;
    answers: UserAnswer[];
    startTime: number;
  } | null;
  
  testRecords: TestRecord[];
  
  // Actions
  startTest: (mode: TestMode, questionBank: QuestionBank, questions: Question[]) => void;
  submitAnswer: (questionId: string, selectedOptions: string[], isCorrect: boolean) => void;
  goToQuestion: (index: number) => void;
  finishTest: (userId: string, completedAt?: string) => TestRecord | null;
  addTestRecord: (record: TestRecord) => void;
  getTestRecords: (userId: string) => TestRecord[];
  getTestRecord: (recordId: string) => TestRecord | undefined;
}

export const useTestStore = create<TestState>()(
  persist(
    (set, get) => ({
      currentTest: null,
      testRecords: [],

      startTest: (mode, questionBank, questions) => {
        set({
          currentTest: {
            mode,
            questionBank,
            questions,
            currentQuestionIndex: 0,
            answers: [],
            startTime: Date.now(),
          },
        });
      },

      submitAnswer: (questionId, selectedOptions, isCorrect) => {
        const state = get();
        if (!state.currentTest) return;

        const existingAnswerIndex = state.currentTest.answers.findIndex(
          (a) => a.questionId === questionId
        );

        const newAnswer: UserAnswer = {
          questionId,
          selectedOptions,
          isCorrect,
          answeredAt: new Date().toISOString(),
        };

        const newAnswers = [...state.currentTest.answers];
        if (existingAnswerIndex >= 0) {
          newAnswers[existingAnswerIndex] = newAnswer;
        } else {
          newAnswers.push(newAnswer);
        }

        set({
          currentTest: {
            ...state.currentTest,
            answers: newAnswers,
          },
        });
      },

      goToQuestion: (index) => {
        const state = get();
        if (!state.currentTest) return;
        if (index < 0 || index >= state.currentTest.questions.length) return;

        set({
          currentTest: {
            ...state.currentTest,
            currentQuestionIndex: index,
          },
        });
      },

      finishTest: (userId, completedAt) => {
        const state = get();
        if (!state.currentTest) return null;

        const { questions, answers, startTime, mode, questionBank } = state.currentTest;
        const completedAtStr = completedAt ?? new Date().toISOString();
        const answerMap = new Map(answers.map((a) => [a.questionId, a]));

        // 補齊未作答題目：沒在 answers 裡的題目視為「未作答」，計為錯誤
        const fullAnswers: UserAnswer[] = questions.map((q) => {
          const existing = answerMap.get(q.id);
          if (existing) return existing;
          return {
            questionId: q.id,
            selectedOptions: [],
            isCorrect: false,
            answeredAt: completedAtStr,
            unanswered: true,
          };
        });

        const duration = Math.floor((Date.now() - startTime) / 1000);
        const correctCount = fullAnswers.filter((a) => a.isCorrect).length;
        const totalQuestions = questions.length;
        const score = Math.round((correctCount / totalQuestions) * 100);
        const passed = score >= 60;

        const record: TestRecord = {
          id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          questionBank,
          mode,
          questions,
          answers: fullAnswers,
          score,
          totalQuestions,
          correctCount,
          duration,
          completedAt: completedAtStr,
          passed,
        };

        set((prevState) => ({
          testRecords: [...prevState.testRecords, record],
          currentTest: null,
        }));

        return record;
      },

      addTestRecord: (record) => {
        set((state) => ({
          testRecords: [...state.testRecords, record],
        }));
      },

      getTestRecords: (userId) => {
        return get().testRecords.filter((r) => r.userId === userId);
      },

      getTestRecord: (recordId) => {
        return get().testRecords.find((r) => r.id === recordId);
      },
    }),
    {
      name: 'test-storage',
    }
  )
);

