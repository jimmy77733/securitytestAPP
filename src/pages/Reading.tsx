import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, HeartOff, BookOpen, Home, ArrowLeft, Image, RefreshCw, X, Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useQuestionStore } from '@/store/questionStore';
import { useFavoriteStore } from '@/store/favoriteStore';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { QuestionImageModal } from '@/components/QuestionImageModal';
import { QuestionGroupContentModal } from '@/components/QuestionGroupContentModal';
import { getQuestionIdsWithImagesSync } from '@/utils/questionImages';
import { getQuestionGroupKey, isQuestionGroupQuestion } from '@/utils/questionGroupUtils';
import {
  getStoredFrequency,
  setStoredFrequency,
  getHighFrequencyQuestionIds,
  getFrequencyInfoForQuestion,
  computeFrequencyByCategory,
} from '@/utils/questionFrequency';
import type { QuestionBank, Question } from '@/types';
import './Reading.css';

export const Reading: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { getQuestions, getAvailableYears, getAvailableCategories } = useQuestionStore();
  const { isFavorite, addFavorite, removeFavorite, getFavorites } = useFavoriteStore();

  const [selectedBank, setSelectedBank] = useState<QuestionBank | 'favorites'>('primary');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [hasStartedReading, setHasStartedReading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIdsWithImages, setQuestionIdsWithImages] = useState<Set<string>>(new Set());
  const [showImageModal, setShowImageModal] = useState(false);
  const [showGroupContentModal, setShowGroupContentModal] = useState(false);
  const [useFrequencyFilter, setUseFrequencyFilter] = useState(false);
  const [showFrequencySyncModal, setShowFrequencySyncModal] = useState(false);
  const [frequencySyncing, setFrequencySyncing] = useState(false);
  const [frequencySyncResult, setFrequencySyncResult] = useState<'success' | { error: string } | null>(null);
  const [frequencyLastSyncedAt, setFrequencyLastSyncedAt] = useState<string | null>(null);

  if (!currentUser) {
    navigate('/');
    return null;
  }

  const availableYears = selectedBank !== 'favorites' ? getAvailableYears(selectedBank) : [];
  const availableCategories = selectedBank !== 'favorites' ? getAvailableCategories(selectedBank) : [];

  const bankQuestionCount = selectedBank !== 'favorites' ? getQuestions(selectedBank).length : 0;
  const favoritesCount = getFavorites(currentUser.id).length;

  const frequencyData = selectedBank !== 'favorites' ? getStoredFrequency(selectedBank) : null;
  const frequencyDisplayTime = frequencyData?.lastSyncedAt
    ? new Date(frequencyData.lastSyncedAt).toLocaleString('zh-TW')
    : '尚未同步';

  const questions = useMemo(() => {
    let list: Question[];
    if (selectedBank === 'favorites') {
      list = getFavorites(currentUser.id).map((f) => f.question);
    } else {
      list = getQuestions(selectedBank);
      if (!useFrequencyFilter && selectedYear) list = list.filter((q) => q.year === selectedYear);
      if (selectedCategory) list = list.filter((q) => q.category === selectedCategory);
      const bankForFreq = selectedBank === 'primary' || selectedBank === 'intermediate' ? selectedBank : null;
      const storedFreq = bankForFreq ? getStoredFrequency(bankForFreq) : null;
      if (useFrequencyFilter && storedFreq?.byCategory) {
        const idSet = new Set<string>();
        if (selectedCategory && storedFreq.byCategory[selectedCategory]) {
          getHighFrequencyQuestionIds(storedFreq, selectedCategory).forEach((id) => idSet.add(id));
        } else {
          Object.keys(storedFreq.byCategory).forEach((cat) => {
            getHighFrequencyQuestionIds(storedFreq, cat).forEach((id) => idSet.add(id));
          });
        }
        list = list.filter((q) => idSet.has(q.id));
        // 出題率篩選：先依出現次數由多到少，相同次數再依年份由早到晚
        list = [...list].sort((a, b) => {
          const fa = getFrequencyInfoForQuestion(storedFreq, a.id);
          const fb = getFrequencyInfoForQuestion(storedFreq, b.id);
          if (!fa && !fb) return 0;
          if (!fa) return 1;
          if (!fb) return -1;
          if (fb.count !== fa.count) return fb.count - fa.count;
          const yearA = fa.years[0] ?? a.year ?? '';
          const yearB = fb.years[0] ?? b.year ?? '';
          return yearA.localeCompare(yearB);
        });
      }
    }
    const seen = new Set<string>();
    return list.filter((q) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
  }, [selectedBank, selectedYear, selectedCategory, currentUser.id, bankQuestionCount, favoritesCount, useFrequencyFilter, frequencyLastSyncedAt]);

  // 當題目列表變更時，預先計算哪些題目有圖片
  useEffect(() => {
    if (questions.length > 0) {
      const idsWithImages = getQuestionIdsWithImagesSync(questions);
      setQuestionIdsWithImages(idsWithImages);
    } else {
      setQuestionIdsWithImages(new Set());
    }
  }, [questions]);

  const handleToggleFavorite = (question: Question) => {
    if (isFavorite(currentUser.id, question.id)) {
      removeFavorite(currentUser.id, question.id);
    } else {
      addFavorite(currentUser.id, question);
    }
  };

  const handleFrequencySync = async () => {
    if (selectedBank === 'favorites') return;
    setFrequencySyncing(true);
    setFrequencySyncResult(null);
    // 先讓 React 提交狀態並讓瀏覽器繪製載入畫面，再執行耗時的同步計算
    await new Promise<void>((r) => {
      requestAnimationFrame(() => requestAnimationFrame(() => r()));
    });
    const minWaitMs = 1000;
    const start = Date.now();
    try {
      const list = getQuestions(selectedBank);
      if (!Array.isArray(list)) {
        throw new Error('無法取得題庫資料');
      }
      const byCategory = computeFrequencyByCategory(list);
      setStoredFrequency(selectedBank, byCategory);
      setFrequencyLastSyncedAt(new Date().toISOString());
      const elapsed = Date.now() - start;
      await new Promise((r) => setTimeout(r, Math.max(0, minWaitMs - elapsed)));
      setFrequencySyncResult('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFrequencySyncResult({ error: message || '同步過程發生錯誤' });
    } finally {
      setFrequencySyncing(false);
    }
  };

  const handleFrequencyFilterChange = (checked: boolean) => {
    setUseFrequencyFilter(checked);
    if (checked) setSelectedYear('');
    setCurrentQuestion(null);
  };

  return (
    <div className="reading-page">
      <div className="reading-header">
        <h1 className="page-title">閱讀模式</h1>
        <div className="reading-header-actions">
          {hasStartedReading ? (
            <Button variant="ghost" size="sm" onClick={() => setHasStartedReading(false)}>
              <ArrowLeft size={20} />
              更換篩選
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
              <Home size={20} />
              返回首頁
            </Button>
          )}
        </div>
      </div>

      {!hasStartedReading ? (
        <div className="reading-setup">
          <Card className="bank-selector">
            <h3 className="sidebar-title">選擇題庫</h3>
            <div className="bank-buttons">
              <Button
                variant={selectedBank === 'primary' ? 'primary' : 'secondary'}
                size="sm"
                fullWidth
                onClick={() => {
                  setSelectedBank('primary');
                  setSelectedYear('');
                  setSelectedCategory('');
                  setCurrentQuestion(null);
                }}
              >
                初級題庫
              </Button>
              <Button
                variant={selectedBank === 'intermediate' ? 'primary' : 'secondary'}
                size="sm"
                fullWidth
                onClick={() => {
                  setSelectedBank('intermediate');
                  setSelectedYear('');
                  setSelectedCategory('');
                  setCurrentQuestion(null);
                }}
              >
                中級題庫
              </Button>
              <Button
                variant={selectedBank === 'favorites' ? 'primary' : 'secondary'}
                size="sm"
                fullWidth
                onClick={() => {
                  setSelectedBank('favorites');
                  setSelectedYear('');
                  setSelectedCategory('');
                  setHasStartedReading(true);
                  setCurrentQuestion(null);
                }}
              >
                已收藏 ({getFavorites(currentUser.id).length})
              </Button>
            </div>
          </Card>

          {selectedBank !== 'favorites' && (
            <Card className="reading-filters">
              <h3 className="sidebar-title">篩選</h3>
              <div className="reading-filter-row">
                {availableYears.length > 0 && (
                  <div className="reading-filter-group">
                    <label htmlFor="reading-year-select" className="reading-filter-label">年份</label>
                    <select
                      id="reading-year-select"
                      className="reading-filter-select"
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        setCurrentQuestion(null);
                      }}
                      disabled={useFrequencyFilter}
                    >
                      <option value="">不限制</option>
                      {availableYears.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                )}
                {availableCategories.length > 0 && (
                  <div className="reading-filter-group">
                    <label htmlFor="reading-category-select" className="reading-filter-label">類別</label>
                    <select
                      id="reading-category-select"
                      className="reading-filter-select"
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setCurrentQuestion(null);
                      }}
                    >
                      <option value="">不限制</option>
                      {availableCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="reading-filter-row reading-frequency-row">
                <div className="reading-filter-group reading-frequency-option">
                  <label className="reading-filter-label">出題率</label>
                  <label className="reading-checkbox-label">
                    <input
                      type="checkbox"
                      checked={useFrequencyFilter}
                      onChange={(e) => handleFrequencyFilterChange(e.target.checked)}
                    />
                    僅顯示最少出現 2 次（含）
                  </label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowFrequencySyncModal(true); setFrequencySyncResult(null); }}
                  className="reading-frequency-sync-btn"
                >
                  <RefreshCw size={16} />
                  同步
                </Button>
              </div>
              {useFrequencyFilter && (
                <p className="reading-frequency-hint">選擇出題率時，年份固定為不限制</p>
              )}
              <div className="reading-start-btn-wrap">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => setHasStartedReading(true)}
                >
                  開始閱讀
                </Button>
              </div>
            </Card>
          )}

          {showFrequencySyncModal && selectedBank !== 'favorites' && (
            <div className="reading-modal-overlay" onClick={() => { if (!frequencySyncing) { setShowFrequencySyncModal(false); setFrequencySyncResult(null); } }}>
              <div className="reading-modal" onClick={(e) => e.stopPropagation()}>
                <div className="reading-modal-header">
                  <h4>出題率同步</h4>
                  <button type="button" className="reading-modal-close" onClick={() => { if (!frequencySyncing) { setShowFrequencySyncModal(false); setFrequencySyncResult(null); } }} aria-label="關閉">
                    <X size={20} />
                  </button>
                </div>
                <div className="reading-modal-body">
                  {frequencySyncing ? (
                    <div className="reading-frequency-sync-loading">
                      <div className="reading-frequency-sync-spinner-wrap">
                        <span className="reading-frequency-sync-track" aria-hidden />
                        <Loader2 size={32} className="reading-frequency-sync-spinner" strokeWidth={2.5} />
                      </div>
                      <p className="reading-frequency-sync-loading-text">正在同步出題率資料…</p>
                    </div>
                  ) : frequencySyncResult === 'success' ? (
                    <p className="reading-frequency-sync-success">同步成功，出題率資料已更新。</p>
                  ) : frequencySyncResult && typeof frequencySyncResult === 'object' && 'error' in frequencySyncResult ? (
                    <p className="reading-frequency-sync-error">同步失敗：{frequencySyncResult.error}</p>
                  ) : (
                    <>
                      <p>上次同步時間：{frequencyDisplayTime}</p>
                      <p>是否執行同步？將依題目內容相似度（80%）來分析目前題庫總年度內，重複題目與出現次數。</p>
                    </>
                  )}
                </div>
                <div className="reading-modal-actions">
                  {frequencySyncing ? null : frequencySyncResult === 'success' || (frequencySyncResult && typeof frequencySyncResult === 'object') ? (
                    <Button variant="primary" onClick={() => { setShowFrequencySyncModal(false); setFrequencySyncResult(null); }}>關閉</Button>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => { setShowFrequencySyncModal(false); setFrequencySyncResult(null); }}>取消</Button>
                      <Button variant="primary" onClick={() => void handleFrequencySync()}>確認同步</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="reading-container">
          <div className="reading-sidebar">
            <Card className="questions-list">
              <h3 className="sidebar-title">題目列表 ({questions.length})</h3>
              <div className="questions-scroll">
                {questions.length === 0 ? (
                  <p className="reading-empty-list">
                    {selectedBank === 'favorites'
                      ? '尚無收藏題目'
                      : '沒有符合篩選條件的題目'}
                  </p>
                ) : questions.map((question, index) => {
                  const freqInfo = useFrequencyFilter && frequencyData ? getFrequencyInfoForQuestion(frequencyData, question.id) : null;
                  return (
                    <button
                      key={question.id}
                      className={`question-item ${currentQuestion?.id === question.id ? 'active' : ''}`}
                      onClick={() => setCurrentQuestion(question)}
                    >
                      <span className="question-item-number">{index + 1}</span>
                      <span className="question-item-text">
                        {question.question.substring(0, 50)}
                        {question.question.length > 50 ? '...' : ''}
                      </span>
                      {freqInfo && (
                        <span className="question-item-frequency">
                          出現 {freqInfo.count} 次 · {freqInfo.years.join('、')}
                        </span>
                      )}
                      {question.type === 'multiple' && (
                        <span className="question-type-badge">[複選]</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="reading-content">
            {currentQuestion ? (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="question-detail">
                  <div className="question-detail-header">
                    <div className="question-detail-title">
                      {currentQuestion.type === 'multiple' && (
                        <span className="question-type-badge">[複選]</span>
                      )}
                      <h2>{currentQuestion.question}</h2>
                      {useFrequencyFilter && frequencyData && (() => {
                        const freqInfo = getFrequencyInfoForQuestion(frequencyData, currentQuestion.id);
                        if (!freqInfo) return null;
                        const categoryQuestions = selectedBank === 'primary' || selectedBank === 'intermediate'
                          ? getQuestions(selectedBank).filter((q) => q.category === currentQuestion.category)
                          : [];
                        const totalYearsInCategory = new Set(categoryQuestions.map((q) => q.year).filter(Boolean)).size;
                        const percentage = totalYearsInCategory > 0
                          ? Math.round((freqInfo.years.length / totalYearsInCategory) * 100)
                          : null;
                        return (
                          <p className="question-detail-frequency">
                            出現 <strong>{freqInfo.count}</strong> 次
                            {percentage != null && ` · ${percentage}% 機率`}
                            {' · 年份：'}
                            {freqInfo.years.join('、')}
                          </p>
                        );
                      })()}
                    </div>
                    <div className="question-detail-header-actions">
                      {questionIdsWithImages.has(currentQuestion.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowImageModal(true)}
                        >
                          <Image size={18} />
                          顯示圖片
                        </Button>
                      )}
                      {isQuestionGroupQuestion(currentQuestion) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowGroupContentModal(true)}
                        >
                          <Image size={18} />
                          顯示題組題目
                        </Button>
                      )}
                      <button
                        className="favorite-btn"
                        onClick={() => handleToggleFavorite(currentQuestion)}
                      >
                        {isFavorite(currentUser.id, currentQuestion.id) ? (
                          <Heart size={24} fill="currentColor" />
                        ) : (
                          <HeartOff size={24} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="question-detail-options">
                    {currentQuestion.options.map((option) => {
                      const isCorrect = currentQuestion.correctAnswers.includes(option.id);
                      return (
                        <div
                          key={option.id}
                          className={`question-detail-option ${isCorrect ? 'correct' : ''}`}
                        >
                          <span className="option-text">{option.text}</span>
                          {isCorrect && (
                            <span className="correct-badge">正確答案</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {currentQuestion.explanation && (
                    <div className="question-detail-explanation">
                      <h4>解析：</h4>
                      <p>{currentQuestion.explanation}</p>
                    </div>
                  )}

                  {currentQuestion.year && (
                    <div className="question-meta">
                      <span>年份：{currentQuestion.year}</span>
                      {currentQuestion.category && (
                        <span>分類：{currentQuestion.category}</span>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            ) : (
              <Card className="question-placeholder">
                <BookOpen size={64} />
                <p>請從左側選擇題目</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {currentQuestion && (
        <>
          <QuestionImageModal
            questionId={currentQuestion.id}
            isOpen={showImageModal}
            onClose={() => setShowImageModal(false)}
          />
          <QuestionGroupContentModal
            groupKey={getQuestionGroupKey(currentQuestion)}
            isOpen={showGroupContentModal}
            onClose={() => setShowGroupContentModal(false)}
          />
        </>
      )}
    </div>
  );
};

