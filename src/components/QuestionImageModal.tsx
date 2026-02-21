import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useImportedImagesStore } from '@/store/importedImagesStore';
import './QuestionImageModal.css';

interface QuestionImageModalProps {
  questionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QuestionImageModal: React.FC<QuestionImageModalProps> = ({
  questionId,
  isOpen,
  onClose,
}) => {
  const imageUrl = useImportedImagesStore((s) => s.getUrl(questionId));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            className="question-image-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal 內容 */}
          <motion.div
            className="question-image-modal"
            initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="question-image-modal-header">
              <h3>題目圖片</h3>
              <button
                className="question-image-modal-close"
                onClick={onClose}
                aria-label="關閉"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="question-image-modal-content">
              <img
                src={imageUrl}
                alt={`題目 ${questionId} 的圖片`}
                className="question-image"
                onError={(e) => {
                  // 圖片載入失敗時的處理
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const errorMsg = target.parentElement?.querySelector('.image-error');
                  if (errorMsg) {
                    (errorMsg as HTMLElement).style.display = 'block';
                  }
                }}
              />
              <div className="image-error" style={{ display: 'none' }}>
                <p>圖片載入失敗</p>
                <p className="image-error-hint">請確認圖片檔案是否存在</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
