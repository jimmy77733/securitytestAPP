import React, { useState, useRef } from 'react';
import { Upload, Download, Info, X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { useQuestionStore } from '@/store/questionStore';
import {
  importQuestions,
  exportQuestions,
  readJsonFile,
  validateQuestions,
  getImportDuplicateInfoByPrefix,
  type DuplicateInfo,
} from '@/utils/importExport';
import { Button } from './Button';
import { Card } from './Card';
import type { Question, QuestionBank } from '@/types';
import './ImportExportPanel.css';

interface ImportExportPanelProps {
  selectedBank: QuestionBank | string;
}

type OverwriteChoice = 'skip' | 'overwrite';

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
  const [overwriteModal, setOverwriteModal] = useState<{
    duplicateInfo: DuplicateInfo;
    parsedQuestions: Question[];
  } | null>(null);

  const runImport = (questions: Question[], overwrite: boolean) => {
    const result = importQuestions(questions, selectedBank, {
      overwriteDuplicates: overwrite,
    });
    setImportResult(result);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      alert('請選擇要匯入的JSON文件');
      return;
    }

    try {
      const data = await readJsonFile(file);
      const raw = Array.isArray(data) ? data : [data];
      const { validated, errors: validateErrors } = validateQuestions(raw, selectedBank);

      if (validated.length === 0) {
        setImportResult({
          success: 0,
          failed: raw.length,
          duplicates: 0,
          errors: validateErrors.length ? validateErrors : ['沒有通過驗證的題目'],
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const duplicateInfo = getImportDuplicateInfoByPrefix(validated, selectedBank);
      if (duplicateInfo && duplicateInfo.duplicateIds.length > 0) {
        setOverwriteModal({ duplicateInfo, parsedQuestions: validated });
        return;
      }

      runImport(validated, false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`匯入失敗: ${message}`);
      setImportResult({
        success: 0,
        failed: 0,
        duplicates: 0,
        errors: [message],
      });
    }
  };

  const handleOverwriteChoice = (choice: OverwriteChoice) => {
    if (!overwriteModal) return;
    runImport(overwriteModal.parsedQuestions, choice === 'overwrite');
    setOverwriteModal(null);
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
  "id": "q_1"(必填),
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
  "year": "115",
  "category": "分類名稱（可選，篩選用）"
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
  "explanation": "多選題解析說明",
  "year": "115",
  "category": "分類名稱（可選，篩選用）"
}`}</pre>
            </div>

            <div className="format-notes">
              <p><strong>注意事項：</strong></p>
              <ul>
                <li>文件必須是JSON格式</li>
                <li>題目必須是陣列格式</li>
                <li>選項ID必須是 opt_a, opt_b, opt_c, opt_d 格式</li>
                <li>如果題目ID重複，需確認後才會匯入，其他題目會繼續匯入</li>
                <li>匯出為JSON檔案，可直接用於備份或分享</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {overwriteModal && (
        <div className="import-modal-overlay" onClick={() => setOverwriteModal(null)}>
          <div className="import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="import-modal-header">
              <AlertTriangle size={24} className="import-modal-icon" />
              <h4>發現重複的題目 ID</h4>
              <button type="button" className="close-btn" onClick={() => setOverwriteModal(null)}>
                <X size={18} />
              </button>
            </div>
            <p className="import-modal-desc">
              匯入的題目中有 <strong>{overwriteModal.duplicateInfo.duplicateIds.length}</strong> 題與現有題庫 ID 重複。
              請選擇處理方式，並可參考下方差異判斷是否覆蓋。
            </p>
            <div className="import-modal-diff-list">
              {overwriteModal.duplicateInfo.details.slice(0, 15).map((d) => (
                <div key={d.id} className="import-modal-diff-item">
                  <span className="import-modal-diff-id">{d.id}</span>
                  <span className="import-modal-diff-summary">{d.diffSummary}</span>
                  <div className="import-modal-diff-preview">
                    <span className="import-modal-diff-label">現有：</span>
                    <span className="import-modal-diff-text">
                      {d.existing.question.slice(0, 50)}
                      {d.existing.question.length > 50 ? '…' : ''}
                    </span>
                  </div>
                  <div className="import-modal-diff-preview">
                    <span className="import-modal-diff-label">匯入：</span>
                    <span className="import-modal-diff-text">
                      {d.incoming.question.slice(0, 50)}
                      {d.incoming.question.length > 50 ? '…' : ''}
                    </span>
                  </div>
                </div>
              ))}
              {overwriteModal.duplicateInfo.details.length > 15 && (
                <p className="import-modal-more">
                  … 尚有 {overwriteModal.duplicateInfo.details.length - 15} 筆重複
                </p>
              )}
            </div>
            <div className="import-modal-actions">
              <Button variant="ghost" onClick={() => setOverwriteModal(null)}>
                取消
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleOverwriteChoice('skip')}
              >
                僅匯入不重複的
              </Button>
              <Button
                variant="primary"
                onClick={() => handleOverwriteChoice('overwrite')}
              >
                覆蓋並匯入
              </Button>
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

