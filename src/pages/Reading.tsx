import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, HeartOff, BookOpen, Home, ArrowLeft, Image } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useQuestionStore } from '@/store/questionStore';
import { useFavoriteStore } from '@/store/favoriteStore';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { QuestionImageModal } from '@/components/QuestionImageModal';
import { QuestionGroupContentModal } from '@/components/QuestionGroupContentModal';
import { getQuestionIdsWithImagesSync } from '@/utils/questionImages';
import { getQuestionGroupKey, isQuestionGroupQuestion } from '@/utils/questionGroupUtils';
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

  if (!currentUser) {
    navigate('/');
    return null;
  }

  const availableYears = selectedBank !== 'favorites' ? getAvailableYears(selectedBank) : [];
  const availableCategories = selectedBank !== 'favorites' ? getAvailableCategories(selectedBank) : [];

  const bankQuestionCount = selectedBank !== 'favorites' ? getQuestions(selectedBank).length : 0;
  const favoritesCount = getFavorites(currentUser.id).length;

  const questions = useMemo(() => {
    let list: Question[];
    if (selectedBank === 'favorites') {
      list = getFavorites(currentUser.id).map((f) => f.question);
    } else {
      list = getQuestions(selectedBank);
      if (selectedYear) list = list.filter((q) => q.year === selectedYear);
      if (selectedCategory) list = list.filter((q) => q.category === selectedCategory);
    }
    const seen = new Set<string>();
    return list.filter((q) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
  }, [selectedBank, selectedYear, selectedCategory, currentUser.id, bankQuestionCount, favoritesCount]);

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
                ) : questions.map((question, index) => (
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
                    {question.type === 'multiple' && (
                      <span className="question-type-badge">[複選]</span>
                    )}
                  </button>
                ))}
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

