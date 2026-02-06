import { useQuestionStore } from '@/store/questionStore';
import { importQuestionsFromJSON } from './pdfParser';
import type { Question, QuestionBank } from '@/types';

/**
 * 載入題庫資料
 */
export function loadQuestionBank(
  bank: QuestionBank,
  questions: Question[]
): void {
  const { loadQuestions } = useQuestionStore.getState();
  loadQuestions(bank, questions);
}

/**
 * 從JSON文件載入題庫
 */
export function loadQuestionBankFromJSON(
  bank: QuestionBank,
  jsonData: any
): void {
  const parsedQuestions = importQuestionsFromJSON(jsonData);
  loadQuestionBank(bank, parsedQuestions as Question[]);
}

/**
 * 初始化示例題目（用於測試）
 */
export function initSampleQuestions(): void {
  const samplePrimary: Question[] = [
    {
      id: 'sample_1',
      questionBank: 'primary',
      type: 'single',
      question: '資訊安全的基本目標是什麼？',
      options: [
        { id: 'opt_1', text: '機密性、完整性、可用性' },
        { id: 'opt_2', text: '速度、效率、成本' },
        { id: 'opt_3', text: '美觀、實用、創新' },
        { id: 'opt_4', text: '以上皆非' },
      ],
      correctAnswers: ['opt_1'],
      explanation: '資訊安全的基本目標是確保資訊的機密性（Confidentiality）、完整性（Integrity）和可用性（Availability），簡稱CIA三元組。',
      year: '2024',
      category: '資訊安全概論',
    },
  ];

  const sampleIntermediate: Question[] = [
    {
      id: 'sample_2',
      questionBank: 'intermediate',
      type: 'multiple',
      question: '下列哪些屬於資訊安全防護措施？（複選）',
      options: [
        { id: 'opt_1', text: '防火牆設定' },
        { id: 'opt_2', text: '入侵偵測系統' },
        { id: 'opt_3', text: '資料加密' },
        { id: 'opt_4', text: '定期備份' },
      ],
      correctAnswers: ['opt_1', 'opt_2', 'opt_3', 'opt_4'],
      explanation: '以上選項都屬於資訊安全防護措施。防火牆用於網路邊界防護，入侵偵測系統用於監控異常行為，資料加密保護資料機密性，定期備份確保資料可用性。',
      year: '2024',
      category: '資訊安全防護',
    },
  ];

  loadQuestionBank('primary', samplePrimary);
  loadQuestionBank('intermediate', sampleIntermediate);
}

