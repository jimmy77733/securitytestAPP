import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Clock, User, AlertTriangle, Sun, Moon, Monitor } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useBankStore } from '@/store/bankStore';
import { useQuestionStore } from '@/store/questionStore';
import { useThemeStore } from '@/store/themeStore';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { QuestionBankSelector } from '@/components/QuestionBankSelector';
import { ImportExportPanel } from '@/components/ImportExportPanel';
import './Home.css';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { getBankById } = useBankStore();
  const { getQuestions } = useQuestionStore();
  const [selectedBankId, setSelectedBankId] = useState<string>('primary');
  const [noQuestionsMessage, setNoQuestionsMessage] = useState<string>('');
  const { mode: themeMode, cycleTheme } = useThemeStore();

  const handleStartTest = () => {
    setNoQuestionsMessage('');
    const bank = getBankById(selectedBankId);
    if (!bank) return;
    const questions = getQuestions(bank.value);
    if (questions.length === 0) {
      setNoQuestionsMessage('尚未匯入題目，請先新增或匯入題目後再開始測驗。');
      return;
    }
    navigate(`/test-setup/${bank.value}`);
  };

  if (!currentUser) {
    navigate('/');
    return null;
  }

  const selectedBank = getBankById(selectedBankId);
  const bankValue = selectedBank?.value || selectedBankId;

  return (
    <div className="home">
      <div className="home-header">
        <div className="user-info">
          <User size={24} />
          <span>{currentUser.name}</span>
        </div>
        <div className="home-header-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => cycleTheme()}
            title={themeMode === 'system' ? '跟隨系統' : themeMode === 'light' ? '明亮' : '黑暗'}
            aria-label="切換背景風格"
          >
            {themeMode === 'system' && <Monitor size={20} />}
            {themeMode === 'light' && <Sun size={20} />}
            {themeMode === 'dark' && <Moon size={20} />}
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            切換使用者
          </Button>
        </div>
      </div>

      <motion.div
        className="home-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="page-title">題庫練習平台</h1>
        <p className="page-subtitle">選擇題庫與測驗模式開始練習</p>

        <div className="mode-selection">
          <Card className="mode-card">
            <h2 className="mode-title">選擇題庫</h2>
            {noQuestionsMessage && (
              <div className="home-inline-alert" role="alert">
                <AlertTriangle size={20} />
                <span>{noQuestionsMessage}</span>
              </div>
            )}
            <QuestionBankSelector
              value={selectedBankId}
              onChange={(id) => {
              setSelectedBankId(id);
              setNoQuestionsMessage('');
            }}
              onStartTest={handleStartTest}
            />
          </Card>
        </div>

        <ImportExportPanel selectedBank={bankValue} />

        <div className="quick-actions">
          <Card className="action-card" onClick={() => navigate('/reading')}>
            <FileText size={32} />
            <h3>閱讀模式</h3>
            <p>瀏覽所有題目與解析</p>
          </Card>
          <Card className="action-card" onClick={() => navigate('/records')}>
            <Clock size={32} />
            <h3>測試紀錄</h3>
            <p>查看歷史成績與錯題</p>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

