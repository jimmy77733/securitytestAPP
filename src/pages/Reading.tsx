import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, HeartOff, BookOpen, Home } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useQuestionStore } from '@/store/questionStore';
import { useFavoriteStore } from '@/store/favoriteStore';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import type { QuestionBank, Question } from '@/types';
import './Reading.css';

export const Reading: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { getQuestions } = useQuestionStore();
  const { isFavorite, addFavorite, removeFavorite, getFavorites } = useFavoriteStore();

  const [selectedBank, setSelectedBank] = useState<QuestionBank | 'favorites'>('primary');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  if (!currentUser) {
    navigate('/');
    return null;
  }

  const questions = selectedBank === 'favorites'
    ? getFavorites(currentUser.id).map((f) => f.question)
    : getQuestions(selectedBank);

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
        <Button variant="ghost" onClick={() => navigate('/home')}>
          <Home size={20} />
          返回首頁
        </Button>
      </div>

      <div className="reading-container">
        <div className="reading-sidebar">
          <Card className="bank-selector">
            <h3 className="sidebar-title">選擇題庫</h3>
            <div className="bank-buttons">
              <Button
                variant={selectedBank === 'primary' ? 'primary' : 'secondary'}
                size="sm"
                fullWidth
                onClick={() => {
                  setSelectedBank('primary');
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
                  setCurrentQuestion(null);
                }}
              >
                已收藏 ({getFavorites(currentUser.id).length})
              </Button>
            </div>
          </Card>

          <Card className="questions-list">
            <h3 className="sidebar-title">題目列表 ({questions.length})</h3>
            <div className="questions-scroll">
              {questions.map((question, index) => (
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
    </div>
  );
};

