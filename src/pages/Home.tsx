import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Clock, User } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useBankStore } from '@/store/bankStore';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { QuestionBankSelector } from '@/components/QuestionBankSelector';
import { ImportExportPanel } from '@/components/ImportExportPanel';
import type { QuestionBank } from '@/types';
import './Home.css';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { getBanks, getBankById } = useBankStore();
  const [selectedBankId, setSelectedBankId] = useState<string>('primary');

  const handleStartTest = () => {
    const bank = getBankById(selectedBankId);
    if (bank) {
      navigate(`/test-setup/${bank.value}`);
    }
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
        >
          切換使用者
        </Button>
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
            <QuestionBankSelector
              value={selectedBankId}
              onChange={setSelectedBankId}
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

