import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Clock, User, AlertTriangle, Sun, Moon, Monitor, RefreshCw } from 'lucide-react';
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
  const [buildModalOpen, setBuildModalOpen] = useState(false);
  const [buildMessage, setBuildMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [buildLoading, setBuildLoading] = useState(false);
  const { mode: themeMode, cycleTheme } = useThemeStore();

  const handleTriggerBuild = async () => {
    setBuildLoading(true);
    setBuildMessage(null);
    try {
      const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
      const res = await fetch(`${base}/api/trigger-build`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setBuildMessage({ success: true, text: '已同步建置完成，請重新整理頁面以載入最新版本。' });
      } else {
        setBuildMessage({ success: false, text: data.error ? `建置失敗：${data.error}` : '建置失敗，請確認伺服器環境可執行 npm run build。' });
      }
    } catch (err) {
      setBuildMessage({ success: false, text: '無法連線至建置服務，請確認以本機伺服器（或執行檔）方式運行。' });
    } finally {
      setBuildLoading(false);
      setBuildModalOpen(true);
    }
  };

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
            className="theme-toggle build-sync-btn"
            onClick={handleTriggerBuild}
            disabled={buildLoading}
            title="同步建置最新版本"
            aria-label="同步建置最新版本"
          >
            <RefreshCw size={20} className={buildLoading ? 'spin' : ''} />
          </button>
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

      {buildModalOpen && buildMessage && (
        <div className="build-sync-modal-overlay" onClick={() => setBuildModalOpen(false)} role="presentation">
          <div className="build-sync-modal" onClick={(e) => e.stopPropagation()}>
            <p className={buildMessage.success ? 'build-sync-success' : 'build-sync-error'}>{buildMessage.text}</p>
            <button type="button" className="build-sync-modal-btn" onClick={() => setBuildModalOpen(false)}>
              確定
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

