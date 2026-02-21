import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Award, Home, Eye, Trash2 } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useTestStore } from '@/store/testStore';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { formatDate, formatDuration } from '@/utils/questionUtils';
import './Records.css';

export const Records: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { getTestRecords, removeTestRecord } = useTestStore();

  if (!currentUser) {
    navigate('/');
    return null;
  }

  const records = getTestRecords(currentUser.id).sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const handleViewRecord = (recordId: string) => {
    navigate('/result', { state: { recordId } });
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!window.confirm('確定要刪除此筆測試紀錄嗎？')) return;
    removeTestRecord(recordId);
  };

  return (
    <div className="records-page">
      <div className="records-header">
        <h1 className="page-title">測試紀錄</h1>
        <Button variant="ghost" onClick={() => navigate('/home')}>
          <Home size={20} />
          返回首頁
        </Button>
      </div>

      <div className="records-container">
        {records.length === 0 ? (
          <Card className="empty-records">
            <Clock size={64} />
            <p>尚無測試紀錄</p>
            <Button variant="primary" onClick={() => navigate('/home')}>
              開始測驗
            </Button>
          </Card>
        ) : (
          <div className="records-list">
            {records.map((record) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="record-card">
                  <div className="record-header">
                    <div className="record-info">
                      <h3 className="record-title">
                        {record.questionBank === 'primary' ? '初級題庫' : '中級題庫'} -{' '}
                        {record.mode === 'exam' ? '標準模擬模式' : '即時檢誤模式'}
                      </h3>
                      <p className="record-date">{formatDate(record.completedAt)}</p>
                    </div>
                    <div className="record-score">
                      <div className={`score-badge ${record.passed ? 'passed' : 'failed'}`}>
                        {record.score}
                      </div>
                      <span className="score-label">分</span>
                    </div>
                  </div>

                  <div className="record-stats">
                    <div className="record-stat">
                      <Award size={20} />
                      <span>
                        {record.correctCount} / {record.totalQuestions} 正確
                      </span>
                    </div>
                    <div className="record-stat">
                      <Clock size={20} />
                      <span>{formatDuration(record.duration)}</span>
                    </div>
                  </div>

                  <div className="record-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleViewRecord(record.id)}
                    >
                      <Eye size={18} />
                      查看詳情
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRecord(record.id)}
                      className="record-delete-btn"
                      aria-label="刪除此紀錄"
                    >
                      <Trash2 size={18} />
                      刪除
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

