import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useQuestionStore } from '@/store/questionStore';
import { useBankStore } from '@/store/bankStore';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import type { QuestionBank, TestMode } from '@/types';
import './TestSetup.css';

export const TestSetup: React.FC = () => {
  const navigate = useNavigate();
  const { bank } = useParams<{ bank: QuestionBank | string }>();
  const { currentUser } = useUserStore();
  const { getQuestions, getRandomQuestions, getAvailableYears, getAvailableCategories } = useQuestionStore();
  const { getBanks } = useBankStore();

  if (!currentUser || !bank) {
    navigate('/home');
    return null;
  }

  const questions = getQuestions(bank);
  const availableYears = getAvailableYears(bank);
  const availableCategories = getAvailableCategories(bank);
  const [selectedYear, setSelectedYear] = React.useState<string>('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('');
  const [setupMessage, setSetupMessage] = React.useState<string>('');

  const handleStartTest = (mode: TestMode) => {
    setSetupMessage('');
    if (questions.length === 0) {
      setSetupMessage('尚未匯入題目，請先新增或匯入題目後再開始測驗。');
      return;
    }

    const yearFilter = selectedYear === '' ? undefined : selectedYear;
    const categoryFilter = selectedCategory === '' ? undefined : selectedCategory;
    const testQuestions = getRandomQuestions(bank, 50, yearFilter, categoryFilter);
    if (testQuestions.length === 0) {
      setSetupMessage('所選年份或類別沒有題目，請改選其他條件或改為「不限制」。');
      return;
    }

    navigate(`/test/${bank}/${mode}`, {
      state: { questions: testQuestions },
    });
  };

  // 獲取題庫名稱
  const banks = getBanks();
  const bankOption = banks.find((b) => b.value === bank);
  const bankName = bankOption?.name || (bank === 'primary' ? '初級題庫' : bank === 'intermediate' ? '中級題庫' : bank);

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

        {setupMessage && (
          <div className="test-setup-inline-alert" role="alert">
            <AlertTriangle size={20} />
            <span>{setupMessage}</span>
          </div>
        )}

        {(availableYears.length > 0 || availableCategories.length > 0) && (
          <div className="test-setup-filters">
            {availableYears.length > 0 && (
              <div className="filter-group">
                <label htmlFor="year-select" className="filter-label">題目年份</label>
                <select
                  id="year-select"
                  className="filter-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">不限制（全選隨機）</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
            {availableCategories.length > 0 && (
              <div className="filter-group">
                <label htmlFor="category-select" className="filter-label">類別</label>
                <select
                  id="category-select"
                  className="filter-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">不限制（全選隨機）</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

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

