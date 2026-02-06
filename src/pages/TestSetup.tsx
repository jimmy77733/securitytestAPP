import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useQuestionStore } from '@/store/questionStore';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import type { QuestionBank, TestMode } from '@/types';
import './TestSetup.css';

export const TestSetup: React.FC = () => {
  const navigate = useNavigate();
  const { bank } = useParams<{ bank: QuestionBank }>();
  const { currentUser } = useUserStore();
  const { getQuestions, getRandomQuestions } = useQuestionStore();

  if (!currentUser || !bank) {
    navigate('/home');
    return null;
  }

  const questions = getQuestions(bank);

  const handleStartTest = (mode: TestMode) => {
    if (questions.length === 0) {
      alert('題庫尚未載入，請先匯入題目');
      return;
    }

    const testQuestions = getRandomQuestions(bank, 50);
    if (testQuestions.length === 0) {
      alert('題庫題目不足，無法開始測驗');
      return;
    }

    navigate(`/test/${bank}/${mode}`, {
      state: { questions: testQuestions },
    });
  };

  const bankName = bank === 'primary' ? '初級題庫' : '中級題庫';

  return (
    <div className="test-setup">
      <motion.div
        className="test-setup-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="page-title">{bankName}</h1>
        <p className="page-subtitle">選擇測驗模式</p>

        <div className="mode-cards">
          <Card className="mode-option-card">
            <div className="mode-icon">
              <CheckCircle size={48} />
            </div>
            <h2 className="mode-option-title">標準模擬模式</h2>
            <p className="mode-description">
              填答過程中不顯示對錯，可自由翻閱上一題修改答案，直到 50 題完成並「提交問卷」後才統一結算。
            </p>
            <p className="mode-suitable">適用：考前衝刺、模擬真實考試體感</p>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => handleStartTest('exam')}
            >
              開始測驗
            </Button>
          </Card>

          <Card className="mode-option-card">
            <div className="mode-icon mode-icon-training">
              <AlertCircle size={48} />
            </div>
            <h2 className="mode-option-title">即時檢誤模式</h2>
            <p className="mode-description">
              選取答案後點擊「確認答案」，系統立即給予視覺反饋。若正確顯示綠色勾號，若錯誤則高亮顯示正確答案，幫助立即導正觀念。
            </p>
            <p className="mode-suitable">適用：觀念建立階段、邊做邊學</p>
            <Button
              variant="success"
              size="lg"
              fullWidth
              onClick={() => handleStartTest('training')}
            >
              開始練習
            </Button>
          </Card>
        </div>

        <div className="test-setup-footer">
          <Button variant="ghost" onClick={() => navigate('/home')}>
            返回
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

