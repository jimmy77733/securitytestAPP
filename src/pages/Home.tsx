import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Clock, User } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import type { QuestionBank, TestMode } from '@/types';
import './Home.css';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();

  const handleStartTest = (questionBank: QuestionBank, mode: TestMode) => {
    navigate(`/test/${questionBank}/${mode}`);
  };

  if (!currentUser) {
    navigate('/');
    return null;
  }

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
            <div className="question-bank-buttons">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/test-setup/primary')}
              >
                <BookOpen size={24} />
                初級題庫
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/test-setup/intermediate')}
              >
                <BookOpen size={24} />
                中級題庫
              </Button>
            </div>
          </Card>
        </div>

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

