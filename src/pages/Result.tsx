import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Award, Home } from 'lucide-react';
import { useTestStore } from '@/store/testStore';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { formatDuration, formatDate } from '@/utils/questionUtils';
import type { UserAnswer } from '@/types';
import './Result.css';

type FilterType = 'all' | 'correct' | 'incorrect';

export const Result: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getTestRecord } = useTestStore();
  const recordId = location.state?.recordId;

  const [filter, setFilter] = useState<FilterType>('all');

  if (!recordId) {
    navigate('/home');
    return null;
  }

  const record = getTestRecord(recordId);
  if (!record) {
    navigate('/home');
    return null;
  }

  const filteredAnswers = record.answers.filter((answer) => {
    if (filter === 'correct') return answer.isCorrect;
    if (filter === 'incorrect') return !answer.isCorrect;
    return true;
  });

  const getAnswerStatus = (answer: UserAnswer) => {
    const question = record.questions.find((q) => q.id === answer.questionId);
    if (!question) return null;

    if (answer.unanswered) {
      return { type: 'unanswered', message: '未作答' };
    }

    const correctAnswers = question.correctAnswers;
    const selectedAnswers = answer.selectedOptions;

    if (answer.isCorrect) {
      return { type: 'correct', message: '答對了' };
    }

    // 多選題的特殊處理
    if (question.type === 'multiple') {
      const missing = correctAnswers.filter((id) => !selectedAnswers.includes(id));
      const extra = selectedAnswers.filter((id) => !correctAnswers.includes(id));

      if (missing.length > 0 && extra.length > 0) {
        return { type: 'partial', message: '多選且漏選' };
      } else if (missing.length > 0) {
        return { type: 'partial', message: '漏選' };
      } else if (extra.length > 0) {
        return { type: 'partial', message: '多選' };
      }
    }

    return { type: 'incorrect', message: '答錯了' };
  };

  return (
    <div className="result-page">
      <motion.div
        className="result-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="result-header">
          <h1 className="page-title">測驗結果</h1>
          <Button variant="ghost" onClick={() => navigate('/home')}>
            <Home size={20} />
            返回首頁
          </Button>
        </div>

        <Card className="result-summary">
          <div className="score-display">
            <motion.div
              className={`score-number ${record.passed ? 'passed' : 'failed'}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
              {record.score}
            </motion.div>
            <div className="score-label">分</div>
          </div>

          <div className="result-stats">
            <div className="stat-item">
              <CheckCircle size={24} className="stat-icon correct" />
              <div>
                <div className="stat-value">{record.correctCount}</div>
                <div className="stat-label">正確</div>
              </div>
            </div>
            <div className="stat-item">
              <XCircle size={24} className="stat-icon incorrect" />
              <div>
                <div className="stat-value">{record.totalQuestions - record.correctCount}</div>
                <div className="stat-label">錯誤</div>
              </div>
            </div>
            <div className="stat-item">
              <Clock size={24} className="stat-icon" />
              <div>
                <div className="stat-value">{formatDuration(record.duration)}</div>
                <div className="stat-label">耗時</div>
              </div>
            </div>
            <div className="stat-item">
              <Award size={24} className={`stat-icon ${record.passed ? 'passed' : ''}`} />
              <div>
                <div className={`stat-value ${record.passed ? 'passed' : 'failed'}`}>
                  {record.passed ? '及格' : '不及格'}
                </div>
                <div className="stat-label">狀態</div>
              </div>
            </div>
          </div>

          <div className="result-meta">
            <p>測驗模式：{record.mode === 'exam' ? '標準模擬模式' : '即時檢誤模式'}</p>
            <p>完成時間：{formatDate(record.completedAt)}</p>
          </div>
        </Card>

        <div className="result-filters">
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            全部 ({record.answers.length})
          </Button>
          <Button
            variant={filter === 'correct' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('correct')}
          >
            正確 ({record.correctCount})
          </Button>
          <Button
            variant={filter === 'incorrect' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('incorrect')}
          >
            錯誤 ({record.totalQuestions - record.correctCount})
          </Button>
        </div>

        <div className="answers-list">
          {filteredAnswers.map((answer, index) => {
            const question = record.questions.find((q) => q.id === answer.questionId);
            if (!question) return null;

            const status = getAnswerStatus(answer);

            return (
              <motion.div
                key={answer.questionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`answer-card ${answer.isCorrect ? 'correct' : 'incorrect'}`}
                >
                  <div className="answer-header">
                    <span className="answer-number">第 {index + 1} 題</span>
                    {question.type === 'multiple' && (
                      <span className="question-type-badge">[複選]</span>
                    )}
                    {status && (
                      <span className={`answer-status ${status.type}`}>
                        {status.message}
                      </span>
                    )}
                  </div>

                  <h3 className="answer-question">{question.question}</h3>

                  <div className="answer-options">
                    {question.options.map((option) => {
                      const isSelected = answer.selectedOptions.includes(option.id);
                      const isCorrect = question.correctAnswers.includes(option.id);

                      return (
                        <div
                          key={option.id}
                          className={`answer-option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isSelected && !isCorrect ? 'wrong' : ''}`}
                        >
                          <span className="option-label">
                            {isCorrect && '✓ '}
                            {isSelected && !isCorrect && '✗ '}
                            {option.text}
                          </span>
                          {isCorrect && (
                            <span className="correct-badge">正確答案</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {question.explanation && (
                    <div className="answer-explanation">
                      <h4>解析：</h4>
                      <p>{question.explanation}</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

