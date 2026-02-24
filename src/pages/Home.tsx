import React, { useState, useEffect, useRef } from 'react';
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

const BUILD_PROGRESS_MAX = 92;
const BUILD_PROGRESS_INTERVAL_MS = 800;
const BUILD_PROGRESS_STEP = 4;
const BUILD_PROGRESS_COMPLETE_DURATION_MS = 550;

/** easeOutCubic: 緩和加速感，由快漸慢到 100% */
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

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
  const [buildProgress, setBuildProgress] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeAnimationRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  progressRef.current = buildProgress;
  const { mode: themeMode, cycleTheme } = useThemeStore();

  useEffect(() => {
    if (!buildLoading) return;
    setBuildProgress(0);
    progressTimerRef.current = setInterval(() => {
      setBuildProgress((p) => {
        const next = Math.min(p + BUILD_PROGRESS_STEP, BUILD_PROGRESS_MAX);
        if (next >= BUILD_PROGRESS_MAX && progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
        return next;
      });
    }, BUILD_PROGRESS_INTERVAL_MS);
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [buildLoading]);

  useEffect(() => {
    if (buildLoading || !buildMessage) return;
    const startValue = progressRef.current;
    if (startValue >= 100) return;
    const startTime = performance.now();
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const ratio = Math.min(1, elapsed / BUILD_PROGRESS_COMPLETE_DURATION_MS);
      const eased = easeOutCubic(ratio);
      const value = startValue + (100 - startValue) * eased;
      setBuildProgress(value);
      if (ratio < 1) {
        completeAnimationRef.current = requestAnimationFrame(animate);
      } else {
        completeAnimationRef.current = null;
      }
    };
    completeAnimationRef.current = requestAnimationFrame(animate);
    return () => {
      if (completeAnimationRef.current != null) {
        cancelAnimationFrame(completeAnimationRef.current);
        completeAnimationRef.current = null;
      }
    };
  }, [buildLoading, buildMessage]);

  const handleTriggerBuild = async () => {
    setBuildLoading(true);
    setBuildMessage(null);
    setBuildProgress(0);
    setBuildModalOpen(true);
    try {
      const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
      const res = await fetch(`${base}/api/trigger-build`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setBuildMessage({ success: true, text: '已同步建置完成。' });
      } else {
        setBuildMessage({ success: false, text: data.error ? `建置失敗：${data.error}` : '建置失敗，請確認伺服器環境可執行 npm run build。' });
      }
    } catch (err) {
      setBuildMessage({ success: false, text: '無法連線至建置服務，請確認以本機伺服器（或執行檔）方式運行。' });
    } finally {
      setBuildLoading(false);
    }
  };

  const handleCloseBuildModal = () => {
    setBuildModalOpen(false);
    setBuildMessage(null);
    setBuildProgress(0);
  };

  const handleConfirmRefresh = () => {
    window.location.reload();
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

      {buildModalOpen && (
        <div
          className="build-sync-modal-overlay"
          onClick={() => { if (!buildLoading && buildMessage && !buildMessage.success) handleCloseBuildModal(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="build-sync-modal-title"
        >
          <div className="build-sync-modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="build-sync-modal-title" className="build-sync-modal-title">
              同步建置
            </h3>
            {buildLoading || !buildMessage ? (
              <>
                <p className="build-sync-modal-status">正在同步建置系統資料中，請稍候…</p>
                <div className="build-sync-progress-wrap">
                  <div className="build-sync-progress-track">
                    <motion.div
                      className="build-sync-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${buildProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="build-sync-progress-pct" aria-live="polite">
                    {Math.round(buildProgress)}%
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className={buildMessage.success ? 'build-sync-success' : 'build-sync-error'}>{buildMessage.text}</p>
                <div className="build-sync-progress-wrap build-sync-progress-done">
                  <div className="build-sync-progress-track">
                    <div className="build-sync-progress-fill" style={{ width: `${buildProgress}%` }} />
                  </div>
                  <span className="build-sync-progress-pct" aria-live="polite">{Math.round(buildProgress)}%</span>
                </div>
                {buildMessage.success ? (
                  <>
                    <p className="build-sync-refresh-hint">點擊下方按鈕將主動刷新頁面以使用最新版本內容。</p>
                    <button type="button" className="build-sync-modal-btn build-sync-confirm-btn" onClick={handleConfirmRefresh}>
                      確認並刷新頁面
                    </button>
                  </>
                ) : (
                  <button type="button" className="build-sync-modal-btn" onClick={() => handleCloseBuildModal()}>
                    關閉
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

