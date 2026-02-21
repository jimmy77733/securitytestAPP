import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuestionStore } from '@/store/questionStore';
import { useImportedImagesStore } from '@/store/importedImagesStore';
import './QuestionImageModal.css';

interface QuestionGroupContentModalProps {
  groupKey: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QuestionGroupContentModal: React.FC<QuestionGroupContentModalProps> = ({
  groupKey,
  isOpen,
  onClose,
}) => {
  const getQuestionGroupContent = useQuestionStore((s) => s.getQuestionGroupContent);
  const content = groupKey ? getQuestionGroupContent(groupKey) : undefined;
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleClose = () => {
    setSelectedImageIndex(null);
    onClose();
  };

  if (!isOpen) return null;

  const imageIds = content?.imageIds ?? [];
  const selectedImageId = selectedImageIndex !== null ? imageIds[selectedImageIndex] ?? null : null;
  const groupImageUrl = useImportedImagesStore((s) => (selectedImageId ? s.getGroupImageUrl(selectedImageId) : ''));

  const hasContent = (content?.contentText && content.contentText.length > 0) || imageIds.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="question-image-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="question-image-modal question-group-content-modal"
            initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="question-image-modal-header">
              <h3>題組題目</h3>
              <button
                className="question-image-modal-close"
                onClick={handleClose}
                aria-label="關閉"
              >
                <X size={24} />
              </button>
            </div>

            <div className="question-image-modal-content question-group-content-modal-body">
              {!hasContent && (
                <p className="image-error">此題組尚無內容，請確認題庫已正確載入題組資料。</p>
              )}
              {content?.contentText && (
                <div className="question-group-content-text">
                  <p>{content.contentText}</p>
                </div>
              )}
              {imageIds.length > 0 && (
                <div className="question-group-image-buttons">
                  {imageIds.map((id, index) => (
                    <button
                      key={id}
                      type="button"
                      className={`question-group-image-btn ${selectedImageIndex === index ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(selectedImageIndex === index ? null : index)}
                    >
                      <ImageIcon size={18} />
                      顯示題組圖片{index + 1}
                    </button>
                  ))}
                </div>
              )}
              <AnimatePresence mode="wait">
                {selectedImageIndex !== null && imageIds[selectedImageIndex] && (
                  <motion.div
                    key={selectedImageIndex}
                    className="question-group-selected-image-wrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <img
                      src={groupImageUrl}
                      alt={`題組圖片 ${selectedImageIndex + 1}`}
                      className="question-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const errorMsg = target.parentElement?.querySelector('.image-error');
                        if (errorMsg) (errorMsg as HTMLElement).style.display = 'block';
                      }}
                    />
                    <div className="image-error" style={{ display: 'none' }}>
                      <p>圖片載入失敗</p>
                      <p className="image-error-hint">請確認圖片檔案是否存在於 question-images</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
