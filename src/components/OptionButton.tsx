import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { QuestionType } from '@/types';
import './OptionButton.css';

interface OptionButtonProps {
  optionId: string;
  text: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  showAnswer?: boolean;
  type: QuestionType;
  onClick: () => void;
}

export const OptionButton: React.FC<OptionButtonProps> = ({
  optionId: _optionId,
  text,
  isSelected,
  isCorrect,
  isWrong,
  showAnswer,
  type,
  onClick,
}) => {
  const isMultiple = type === 'multiple';

  return (
    <motion.button
      className={`option-btn ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''} ${showAnswer ? 'show-answer' : ''} ${isMultiple ? 'multiple' : 'single'}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="option-indicator">
        {isMultiple ? (
          <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
            {isSelected && <Check size={16} />}
          </div>
        ) : (
          <div className={`radio ${isSelected ? 'checked' : ''}`}>
            {isSelected && <div className="radio-dot" />}
          </div>
        )}
      </div>
      <span className="option-text">{text}</span>
      {showAnswer && isCorrect && (
        <span className="correct-badge">正確解答</span>
      )}
      {isWrong && <X size={20} className="wrong-icon" />}
    </motion.button>
  );
};

