import React, { useState, useRef } from 'react';
import { Upload, Download, Info, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuestionStore } from '@/store/questionStore';
import { importQuestions, exportQuestions, readJsonFile } from '@/utils/importExport';
import { Button } from './Button';
import { Card } from './Card';
import type { QuestionBank } from '@/types';
import './ImportExportPanel.css';

interface ImportExportPanelProps {
  selectedBank: QuestionBank | string;
}

export const ImportExportPanel: React.FC<ImportExportPanelProps> = ({
  selectedBank,
}) => {
  const { getQuestions } = useQuestionStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    duplicates: number;
    errors: string[];
  } | null>(null);
  const [showFormatInfo, setShowFormatInfo] = useState(false);

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      alert('請選擇要匯入的JSON文件');
      return;
    }

    try {
      const data = await readJsonFile(file);
      
      // 確保是陣列格式
      const questions = Array.isArray(data) ? data : [data];
      
      const result = importQuestions(questions, selectedBank);
      setImportResult(result);

      if (result.success > 0) {
        // 重置文件輸入
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error: any) {
      alert(`匯入失敗: ${error.message}`);
      setImportResult({
        success: 0,
        failed: 0,
        duplicates: 0,
        errors: [error.message],
      });
    }
  };

  const handleExport = () => {
    const questions = getQuestions(selectedBank);
    if (questions.length === 0) {
      alert('此題庫目前沒有題目');
      return;
    }

    const json = exportQuestions(selectedBank);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `題庫_${selectedBank}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const questionCount = getQuestions(selectedBank).length;

  return (
    <Card className="import-export-panel">
      <div className="panel-header">
        <h3 className="panel-title">題庫管理</h3>
        <div className="question-count">
          目前題數: <strong>{questionCount}</strong>
        </div>
      </div>

      <div className="panel-actions">
        <div className="action-group">
          <Button
            variant="primary"
            size="md"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} />
            匯入題庫
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <Button
            variant="secondary"
            size="md"
            onClick={handleExport}
            disabled={questionCount === 0}
          >
            <Download size={18} />
            匯出題庫 (JSON)
          </Button>
        </div>

        <button
          className="format-info-btn"
          onClick={() => setShowFormatInfo(!showFormatInfo)}
        >
          <Info size={18} />
          格式說明
        </button>
      </div>

      {showFormatInfo && (
        <div className="format-info">
          <div className="format-info-header">
            <h4>匯入格式說明</h4>
            <button
              className="close-btn"
              onClick={() => setShowFormatInfo(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="format-examples">
            <div className="format-example">
              <h5>單選題格式：</h5>
              <pre>{`{
  "id": "q_1",
  "questionBank": "primary",
  "type": "single",
  "question": "題目內容",
  "options": [
    { "id": "opt_a", "text": "選項A" },
    { "id": "opt_b", "text": "選項B" },
    { "id": "opt_c", "text": "選項C" },
    { "id": "opt_d", "text": "選項D" }
  ],
  "correctAnswers": ["opt_a"],
  "explanation": "解析說明（可選）",
  "year": "2024",
  "category": "分類名稱（可選）"
}`}</pre>
            </div>

            <div className="format-example">
              <h5>複選題格式：</h5>
              <pre>{`{
  "id": "q_2",
  "questionBank": "intermediate",
  "type": "multiple",
  "question": "多選題題目內容",
  "options": [
    { "id": "opt_a", "text": "選項A" },
    { "id": "opt_b", "text": "選項B" },
    { "id": "opt_c", "text": "選項C" },
    { "id": "opt_d", "text": "選項D" }
  ],
  "correctAnswers": ["opt_a", "opt_b", "opt_c"],
  "explanation": "多選題解析說明"
}`}</pre>
            </div>

            <div className="format-notes">
              <p><strong>注意事項：</strong></p>
              <ul>
                <li>文件必須是JSON格式</li>
                <li>題目必須是陣列格式</li>
                <li>選項ID必須是 opt_a, opt_b, opt_c, opt_d 格式</li>
                <li>如果題目ID重複，該題目將不會匯入，其他題目會繼續匯入</li>
                <li>匯出為JSON檔案，可直接用於備份或分享</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {importResult && (
        <div className={`import-result ${importResult.success > 0 ? 'success' : 'error'}`}>
          <div className="result-header">
            {importResult.success > 0 ? (
              <CheckCircle size={20} className="result-icon" />
            ) : (
              <AlertCircle size={20} className="result-icon" />
            )}
            <span className="result-title">
              {importResult.success > 0 ? '匯入成功' : '匯入失敗'}
            </span>
            <button
              className="close-btn"
              onClick={() => setImportResult(null)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="result-stats">
            <div className="stat-item">
              <span className="stat-label">成功:</span>
              <span className="stat-value success">{importResult.success}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">失敗:</span>
              <span className="stat-value error">{importResult.failed}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">重複:</span>
              <span className="stat-value warning">{importResult.duplicates}</span>
            </div>
          </div>
          {importResult.errors.length > 0 && (
            <div className="result-errors">
              <p className="errors-title">錯誤詳情：</p>
              <ul>
                {importResult.errors.slice(0, 5).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {importResult.errors.length > 5 && (
                  <li>... 還有 {importResult.errors.length - 5} 個錯誤</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

