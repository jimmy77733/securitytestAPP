import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useTestStore } from '@/store/testStore';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { OptionButton } from '@/components/OptionButton';
import { QuestionImageModal } from '@/components/QuestionImageModal';
import { QuestionGroupContentModal } from '@/components/QuestionGroupContentModal';
import { checkAnswer } from '@/utils/questionUtils';
import { getQuestionIdsWithImagesSync } from '@/utils/questionImages';
import { getQuestionGroupKey, isQuestionGroupQuestion } from '@/utils/questionGroupUtils';
import type { Question, QuestionBank, TestMode } from '@/types';
import './Test.css';

export const Test: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bank, mode } = useParams<{ bank: QuestionBank | string; mode: TestMode }>();
  const { currentUser } = useUserStore();
  const { currentTest, startTest, submitAnswer, goToQuestion, finishTest } = useTestStore();

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questionIdsWithImages, setQuestionIdsWithImages] = useState<Set<string>>(new Set());
  const [showImageModal, setShowImageModal] = useState(false);
  const [showGroupContentModal, setShowGroupContentModal] = useState(false);

  const questions = (location.state?.questions as Question[]) || [];
  const isTrainingMode = mode === 'training';
  const isExamMode = mode === 'exam';

  useEffect(() => {
    if (!currentUser || !bank || !mode || questions.length === 0) {
      navigate('/home');
      return;
    }

    // 預先計算哪些題目有圖片（只執行一次，當題目載入時）
    const idsWithImages = getQuestionIdsWithImagesSync(questions);
    setQuestionIdsWithImages(idsWithImages);

    if (!currentTest) {
      startTest(mode, bank as QuestionBank, questions);
      return;
    }

    const currentQuestion = questions[currentTest.currentQuestionIndex];
    if (currentQuestion) {
      const existingAnswer = currentTest.answers.find(
        (a) => a.questionId === currentQuestion.id
      );
      if (existingAnswer) {
        setSelectedOptions(existingAnswer.selectedOptions);
        setHasAnswered(true);
        if (isTrainingMode) {
          setIsCorrect(existingAnswer.isCorrect);
          setShowFeedback(true);
        }
      } else {
        setSelectedOptions([]);
        setHasAnswered(false);
        setShowFeedback(false);
      }
    }
  }, [currentTest?.currentQuestionIndex, currentTest, currentUser, bank, mode, questions, navigate, isTrainingMode, startTest]);

  if (!currentUser || !currentTest || questions.length === 0) {
    return null;
  }

  const currentIndex = currentTest.currentQuestionIndex;
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleOptionClick = (optionId: string) => {
    if (hasAnswered && isExamMode) {
      // 考試模式下已回答後仍可修改
      const newSelected = currentQuestion.type === 'single'
        ? [optionId]
        : selectedOptions.includes(optionId)
          ? selectedOptions.filter((id) => id !== optionId)
          : [...selectedOptions, optionId];
      setSelectedOptions(newSelected);
    } else if (!hasAnswered) {
      // 未回答時可選擇
      const newSelected = currentQuestion.type === 'single'
        ? [optionId]
        : selectedOptions.includes(optionId)
          ? selectedOptions.filter((id) => id !== optionId)
          : [...selectedOptions, optionId];
      setSelectedOptions(newSelected);
    }
  };

  const submitCurrentAnswer = () => {
    const opts = selectedOptions;
    const correct = opts.length > 0 ? checkAnswer(currentQuestion, opts) : false;
    submitAnswer(currentQuestion.id, opts, correct);
  };

  const handleConfirmAnswer = () => {
    if (selectedOptions.length === 0) {
      alert('請至少選擇一個答案');
      return;
    }

    const correct = checkAnswer(currentQuestion, selectedOptions);
    setIsCorrect(correct);
    submitAnswer(currentQuestion.id, selectedOptions, correct);

    if (isTrainingMode) {
      setShowFeedback(true);
      setHasAnswered(true);
    } else {
      handleNext();
    }
  };

  const handleNext = () => {
    if (isExamMode) {
      submitCurrentAnswer();
    }
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1);
      setSelectedOptions([]);
      setShowFeedback(false);
      setHasAnswered(false);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1);
    }
  };

  const handleFinish = () => {
    if (isExamMode && currentTest.answers.length < questions.length) {
      if (!confirm('還有未回答的題目，未作答將計為錯誤。確定要結束測驗嗎？')) {
        return;
      }
    }
    submitCurrentAnswer();
    const record = finishTest(currentUser.id);
    if (record) {
      navigate('/result', { state: { recordId: record.id } });
    }
  };

  const handleEarlySubmit = () => {
    if (!confirm('確定要提早交卷嗎？未作答的題目將計為錯誤。')) return;
    submitCurrentAnswer();
    const record = finishTest(currentUser.id);
    if (record) {
      navigate('/result', { state: { recordId: record.id } });
    }
  };

  const getAnsweredQuestions = () => {
    return currentTest.answers.map((a) => a.questionId);
  };

  return (
    <div className="test-page">
      <div className="test-header">
        <div className="test-info">
          <span className="test-mode-badge">
            {isTrainingMode ? '即時檢誤模式' : '標準模擬模式'}
          </span>
          <span className="question-counter">
            第 {currentIndex + 1} / {questions.length} 題
          </span>
        </div>
        {isExamMode && (
          <Button variant="ghost" size="sm" onClick={handleFinish}>
            提交問卷
          </Button>
        )}
        {isTrainingMode && (
          <Button variant="ghost" size="sm" onClick={handleEarlySubmit}>
            提早交卷
          </Button>
        )}
      </div>

      <div className="progress-bar-container">
        <motion.div
          className="progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="test-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className={`question-card ${showFeedback && !isCorrect ? 'shake' : ''} ${showFeedback && isCorrect ? 'flash-green' : ''}`}
            >
              <div className="question-header">
                {currentQuestion.type === 'multiple' && (
                  <span className="question-type-badge">[複選]</span>
                )}
                <h2 className="question-text">{currentQuestion.question}</h2>
              </div>

              {questionIdsWithImages.has(currentQuestion.id) && (
                <div className="question-image-button-container">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowImageModal(true)}
                  >
                    <Image size={18} />
                    顯示圖片
                  </Button>
                </div>
              )}

              {isQuestionGroupQuestion(currentQuestion) && (
                <div className="question-image-button-container">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGroupContentModal(true)}
                  >
                    <Image size={18} />
                    顯示題組題目
                  </Button>
                </div>
              )}

              <div className="options-container">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOptions.includes(option.id);
                  const isCorrectOption = currentQuestion.correctAnswers.includes(option.id);
                  const isWrongSelected = isSelected && !isCorrectOption && showFeedback;

                  return (
                    <OptionButton
                      key={option.id}
                      optionId={option.id}
                      text={option.text}
                      isSelected={isSelected}
                      isCorrect={showFeedback && isCorrectOption}
                      isWrong={isWrongSelected}
                      showAnswer={showFeedback && !isCorrect}
                      type={currentQuestion.type}
                      onClick={() => handleOptionClick(option.id)}
                    />
                  );
                })}
              </div>

              {showFeedback && isCorrect && (
                <motion.div
                  className="feedback-correct"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Check size={32} />
                  <span>答對了！</span>
                </motion.div>
              )}

              {currentQuestion.explanation && showFeedback && (
                <motion.div
                  className="explanation"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h4>解析：</h4>
                  <p>{currentQuestion.explanation}</p>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="test-navigation">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={20} />
            上一題
          </Button>

          {isTrainingMode ? (
            !hasAnswered ? (
              <Button
                variant="primary"
                onClick={handleConfirmAnswer}
                disabled={selectedOptions.length === 0}
              >
                確認答案
              </Button>
            ) : (
              <Button variant="success" onClick={handleNext}>
                下一題
                <ChevronRight size={20} />
              </Button>
            )
          ) : (
            <Button
              variant="primary"
              onClick={handleNext}
            >
              {currentIndex === questions.length - 1 ? '完成' : '下一題'}
              <ChevronRight size={20} />
            </Button>
          )}
        </div>
      </div>

      {isExamMode && (
        <div className="question-grid">
          {questions.map((q, index) => {
            const isAnswered = getAnsweredQuestions().includes(q.id);
            return (
              <button
                key={q.id}
                className={`question-grid-item ${isAnswered ? 'answered' : ''} ${index === currentIndex ? 'current' : ''}`}
                onClick={() => goToQuestion(index)}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      )}

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
    </div>
  );
};

