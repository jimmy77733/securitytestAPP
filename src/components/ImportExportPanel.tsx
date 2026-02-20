import React, { useState, useRef } from 'react';
import { Upload, Download, Info, X, CheckCircle, AlertCircle, AlertTriangle, ImagePlus } from 'lucide-react';
import { useQuestionStore } from '@/store/questionStore';
import {
  importQuestions,
  exportQuestionsFromList,
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
  const { getQuestions, getAvailableYears, getAvailableCategories, getAllBanks } = useQuestionStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportYear, setExportYear] = useState<string>('');
  const [exportCategory, setExportCategory] = useState<string>('');
  const [exportConfirm, setExportConfirm] = useState<{
    count: number;
    yearLabel: string;
    categoryLabel: string;
    filteredQuestions: Question[];
  } | null>(null);
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

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageImportList, setImageImportList] = useState<Array<{ id: string; file: File; name: string; overLimit: boolean }>>([]);
  const [showImageImportModal, setShowImageImportModal] = useState(false);
  const [showImageImportHelp, setShowImageImportHelp] = useState(false);
  const [imageImportResult, setImageImportResult] = useState<{ success: number; errors?: string[] } | null>(null);
  const [imageOverwriteModal, setImageOverwriteModal] = useState<{
    existing: Array<{ name: string; mtime: string | null }>;
    pendingPayload: Array<{ name: string; data: string }>;
  } | null>(null);

  const MAX_IMAGE_FILES = 15;
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

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

  const performExport = (questionsToExport: Question[]) => {
    const json = exportQuestionsFromList(questionsToExport);
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

  const handleExport = () => {
    const questions = getQuestions(selectedBank);
    if (questions.length === 0) {
      alert('此題庫目前沒有題目');
      return;
    }

    let filtered = questions;
    if (exportYear) {
      filtered = filtered.filter((q) => q.year === exportYear);
    }
    if (exportCategory) {
      filtered = filtered.filter((q) => q.category === exportCategory);
    }

    if (filtered.length === 0) {
      alert('所選的年份或類別沒有題目，請改選其他條件或改為「不限制」。');
      return;
    }

    const yearLabel = exportYear ? exportYear : '不限制';
    const categoryLabel = exportCategory ? exportCategory : '不限制';
    setExportConfirm({
      count: filtered.length,
      yearLabel,
      categoryLabel,
      filteredQuestions: filtered,
    });
  };

  const handleExportConfirm = () => {
    if (!exportConfirm) return;
    performExport(exportConfirm.filteredQuestions);
    setExportConfirm(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    
    // 計算還可以新增多少張圖片
    const currentCount = imageImportList.length;
    const remainingSlots = MAX_IMAGE_FILES - currentCount;
    const filesToAdd = files.slice(0, remainingSlots);
    
    if (filesToAdd.length === 0) {
      alert(`已達到最大數量限制（${MAX_IMAGE_FILES} 張）`);
      e.target.value = '';
      return;
    }
    
    if (files.length > remainingSlots) {
      alert(`最多只能再新增 ${remainingSlots} 張圖片（總數限制 ${MAX_IMAGE_FILES} 張）`);
    }
    
    const newItems = filesToAdd.map((file, index) => ({
      id: `${file.name}-${index}-${Date.now()}`,
      file,
      name: file.name,
      overLimit: file.size > MAX_IMAGE_SIZE,
    }));
    
    // 追加到現有列表，而不是替換
    setImageImportList((prev) => [...prev, ...newItems]);
    setShowImageImportModal(true);
    e.target.value = '';
  };

  const removeImageImportItem = (id: string) => {
    setImageImportList((prev) => prev.filter((item) => item.id !== id));
  };

  const performImageSave = async (filesPayload: Array<{ name: string; data: string }>, overwriteNames: string[]) => {
    try {
      const res = await fetch('/api/save-question-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesPayload, overwriteNames }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setImageImportResult({ success: data.saved, errors: data.errors });
        setShowImageImportModal(false);
        setImageImportList([]);
        setImageOverwriteModal(null);
        if (data.saved > 0 && typeof window !== 'undefined' && (window as any).preloadImageManifest) {
          (window as any).preloadImageManifest();
        }
      } else {
        setImageImportResult({
          success: 0,
          errors: [data.error || '匯入失敗，請確認伺服器已啟動且可寫入 public/question-images'],
        });
      }
    } catch (err) {
      setImageImportResult({
        success: 0,
        errors: ['無法連線至伺服器，請確認應用程式已透過支援匯入圖片的伺服器啟動。'],
      });
    }
  };

  const handleImageImportConfirm = async () => {
    const valid = imageImportList.filter((item) => !item.overLimit);
    if (valid.length === 0) {
      setImageImportResult({
        success: 0,
        errors: ['沒有可匯入的圖片（請移除超過 2MB 的檔案）'],
      });
      return;
    }

    const banks = getAllBanks();
    const allQuestionIds = new Set<string>();
    banks.forEach((bank) => {
      getQuestions(bank).forEach((q) => allQuestionIds.add(q.id));
    });

    const invalidIds: string[] = [];
    valid.forEach((item) => {
      const questionId = item.name.replace(/\.(png|jpg|jpeg)$/i, '');
      if (!allQuestionIds.has(questionId)) {
        invalidIds.push(item.name);
      }
    });

    if (invalidIds.length > 0) {
      setImageImportResult({
        success: 0,
        errors: [
          '以下圖片沒有對應題目，請先匯入題庫後再匯入圖片：',
          ...invalidIds.map((n) => `・${n}`),
        ],
      });
      // 不清空列表，讓用戶可以修正後重試
      return;
    }

    try {
      const filesPayload = await Promise.all(
        valid.map(async (item) => {
          const buf = await item.file.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          return { name: item.name, data: base64 };
        })
      );

      const checkRes = await fetch('/api/check-question-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames: valid.map((i) => i.name) }),
      });
      const checkData = await checkRes.json().catch(() => ({}));
      const existing = Array.isArray(checkData.existing) ? checkData.existing : [];

      if (existing.length > 0) {
        setImageOverwriteModal({ existing, pendingPayload: filesPayload });
        return;
      }

      await performImageSave(filesPayload, []);
    } catch (err) {
      setImageImportResult({
        success: 0,
        errors: ['無法連線至伺服器，請確認應用程式已透過支援匯入圖片的伺服器啟動。'],
      });
    }
  };

  const handleImageOverwriteConfirm = () => {
    if (!imageOverwriteModal) return;
    const overwriteNames = imageOverwriteModal.existing.map((e) => e.name);
    performImageSave(imageOverwriteModal.pendingPayload, overwriteNames);
  };

  const questionCount = getQuestions(selectedBank).length;
  const availableYears = getAvailableYears(selectedBank);
  const availableCategories = getAvailableCategories(selectedBank);
  const hasExportFilters = availableYears.length > 0 || availableCategories.length > 0;

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
            onClick={() => imageInputRef.current?.click()}
          >
            <ImagePlus size={18} />
            匯入圖片
          </Button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            multiple
            style={{ display: 'none' }}
            onChange={handleImageSelect}
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
          {hasExportFilters && (
            <div className="export-filters">
              {availableYears.length > 0 && (
                <div className="export-filter-group">
                  <label htmlFor="export-year-select" className="export-filter-label">匯出年份</label>
                  <select
                    id="export-year-select"
                    className="export-filter-select"
                    value={exportYear}
                    onChange={(e) => setExportYear(e.target.value)}
                  >
                    <option value="">不限制</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              )}
              {availableCategories.length > 0 && (
                <div className="export-filter-group">
                  <label htmlFor="export-category-select" className="export-filter-label">匯出類別</label>
                  <select
                    id="export-category-select"
                    className="export-filter-select"
                    value={exportCategory}
                    onChange={(e) => setExportCategory(e.target.value)}
                  >
                    <option value="">不限制</option>
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className="format-info-btn"
          onClick={() => setShowFormatInfo(!showFormatInfo)}
        >
          <Info size={18} />
          格式說明
        </button>
        <button
          className="format-info-btn"
          onClick={() => setShowImageImportHelp(!showImageImportHelp)}
        >
          <Info size={18} />
          匯入圖片說明
        </button>
      </div>

      {showImageImportHelp && (
        <div className="image-import-help">
          <div className="image-import-help-header">
            <h4>匯入圖片說明</h4>
            <button type="button" className="close-btn" onClick={() => setShowImageImportHelp(false)}>
              <X size={18} />
            </button>
          </div>
          <ul>
            <li><strong>命名條件：</strong>檔名須與題目 ID 完全一致，副檔名為 .png、.jpg 或 .jpeg。例如題目 ID 為 <code>q_intermediate_s_109_1_1</code>，則檔名為 <code>q_intermediate_s_109_1_1.png</code>。</li>
            <li><strong>大小限制：</strong>單張圖片最大 2MB，超過的檔案將無法匯入並會標示失敗。</li>
            <li>單次最多可選擇 15 張圖片；確認後會寫入 <code>public/question-images</code>，並自動更新圖片清單。</li>
          </ul>
        </div>
      )}

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
  "id": "q_primary_108-2_s_1(必填，題目唯一識別碼) ",
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
  "year": "108-2",
  "category": "資訊安全管理概論(（可選，篩選用)"
}`}</pre>
            </div>

            <div className="format-example">
              <h5>複選題格式：</h5>
              <pre>{`{
  "id": "q_intermediate_109-1_o_1(必填，題目唯一識別碼) ",
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
  "year": "109-1",
  "category": "資訊安全規劃實務(可選，篩選用)"
}`}</pre>
            </div>

            <div className="format-notes">
              <p><strong>必填欄位：</strong></p>
              <ul>
                <li><code>id</code>：題目唯一識別碼（建議含題庫、年份等，例：q_primary_108-2_1）</li>
                <li><code>questionBank</code>：題庫類型（primary / intermediate 或自訂）</li>
                <li><code>type</code>：題型（single 單選 / multiple 複選）</li>
                <li><code>question</code>、<code>options</code>、<code>correctAnswers</code></li>
              </ul>
              <p><strong>選填欄位：</strong></p>
              <ul>
                <li><code>explanation</code>：解析說明</li>
                <li><code>year</code>：年份／學期（用於篩選與匯出範圍，例：108-2、114-1）</li>
                <li><code>category</code>：類別名稱（用於篩選與匯出範圍）</li>
              </ul>
              <p><strong>注意事項：</strong></p>
              <ul>
                <li>文件必須是 JSON 格式，題目為陣列 <code>[...]</code></li>
                <li>選項 ID 須為 opt_a、opt_b、opt_c、opt_d</li>
                <li>題目 ID 重複時會提示是否覆蓋，其他題目會繼續匯入</li>
                <li>匯出可依「年份」「類別」篩選範圍，匯出前會顯示確認與總題數</li>
                <li><strong>題目圖片：</strong>若題目需搭配圖片，請將圖片放入 <code>public/question-images/</code>，檔名為 <code>{"{題目id}"}.png</code>，並執行 <code>npm run generate-image-manifest</code> 更新清單，作答時會顯示「顯示圖片」按鈕</li>
                <li><strong>題組題：</strong>中級題目可設 <code>questionGroupId</code>（例：<code>"1"</code> 表示題組 1）；同一題庫、科目、年份的題組需在該題庫 JSON 內提供 <code>questionGroups</code> 陣列，每筆含 <code>groupKey</code>（例：<code>intermediate_資訊安全防護實務_108-1</code>）、<code>contentText</code>（選填）、<code>imageIds</code>（題組圖片 ID 清單）。題組圖片檔名為 <code>{"{imageId}"}.png</code>，置於 <code>public/question-images/</code>，作答時會顯示「顯示題組題目」按鈕並可依序查看題組圖片。中級題庫可採「單一物件」格式：<code>{"description":"（選填）","questionGroups":[...],"questions":[...]}</code>，同一檔案內僅能有一組 <code>description</code>／<code>questionGroups</code>／<code>questions</code>，多科目時請合併 <code>questionGroups</code> 與 <code>questions</code> 陣列（參考 <code>src/data/banks/q_intermediate_108-1.json</code>）</li>
                <li><strong>初階題目 ID 區分科目：</strong>為避免題目圖片錯用，初階題目若 <code>category</code> 為「資訊安全管理概論」請在 id 尾號前加 <code>_m_</code>（例：<code>q_primary_114-1_m_5</code>），若為「資訊安全技術概論」請加 <code>_s_</code>（例：<code>q_primary_113-2_s_1</code>）</li>
                <li><strong>中級題目 ID 區分科目：</strong>中級題目若 <code>category</code> 為「資訊安全防護實務」請在 id 尾號前加 <code>_p_</code>（例：<code>q_intermediate_108-1_p_1</code>），若為「資訊安全規劃實務」請加 <code>_o_</code>（例：<code>q_intermediate_108-1_o_1</code>）</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {exportConfirm && (
        <div className="import-modal-overlay" onClick={() => setExportConfirm(null)}>
          <div className="import-modal export-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="import-modal-header">
              <Download size={24} className="import-modal-icon export-confirm-icon" />
              <h4>確認匯出題庫</h4>
              <button type="button" className="close-btn" onClick={() => setExportConfirm(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="export-confirm-body">
              <p className="export-confirm-desc">請確認以下匯出範圍與題數後再匯出。</p>
              <dl className="export-confirm-summary">
                <dt>匯出年份</dt>
                <dd>{exportConfirm.yearLabel}</dd>
                <dt>匯出類別</dt>
                <dd>{exportConfirm.categoryLabel}</dd>
                <dt>總題數</dt>
                <dd><strong>{exportConfirm.count}</strong> 題</dd>
              </dl>
            </div>
            <div className="import-modal-actions">
              <Button variant="ghost" onClick={() => setExportConfirm(null)}>
                取消
              </Button>
              <Button variant="primary" onClick={handleExportConfirm}>
                確認匯出
              </Button>
            </div>
          </div>
        </div>
      )}

      {showImageImportModal && (
        <div className="import-modal-overlay" onClick={() => { setShowImageImportModal(false); setImageImportList([]); setImageImportResult(null); }}>
          <div className="import-modal image-import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="import-modal-header">
              <ImagePlus size={24} className="import-modal-icon" />
              <h4>確認匯入圖片</h4>
              <button type="button" className="close-btn" onClick={() => { setShowImageImportModal(false); setImageImportList([]); setImageImportResult(null); }}>
                <X size={18} />
              </button>
            </div>
            <p className="image-import-desc">以下為選取的圖片，可刪除不需匯入的項目。超過 2MB 的檔案將無法匯入。</p>
            <ul className="image-import-list">
              {imageImportList.map((item) => (
                <li key={item.id} className={`image-import-item ${item.overLimit ? 'over-limit' : ''}`}>
                  <span className="image-import-filename">{item.name}</span>
                  {item.overLimit && <span className="image-import-badge">超過 2MB</span>}
                  <button
                    type="button"
                    className="image-import-remove"
                    onClick={() => removeImageImportItem(item.id)}
                    aria-label="移除"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
            {imageImportList.length < MAX_IMAGE_FILES && (
              <div className="image-import-add-more">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImagePlus size={16} />
                  新增更多圖片 ({imageImportList.length}/{MAX_IMAGE_FILES})
                </Button>
              </div>
            )}
            {imageImportResult && imageImportResult.success === 0 && imageImportResult.errors && (
              <div className="image-import-error-preview">
                <AlertCircle size={16} />
                <div className="image-import-error-content">
                  {imageImportResult.errors.map((err, idx) => (
                    <div key={idx} className="image-import-error-item">{err}</div>
                  ))}
                </div>
              </div>
            )}
            <div className="import-modal-actions">
              <Button variant="ghost" onClick={() => { setShowImageImportModal(false); setImageImportList([]); setImageImportResult(null); }}>
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleImageImportConfirm}
                disabled={imageImportList.filter((i) => !i.overLimit).length === 0}
              >
                確認匯入
              </Button>
            </div>
          </div>
        </div>
      )}

      {imageOverwriteModal && (
        <div className="import-modal-overlay" onClick={() => setImageOverwriteModal(null)}>
          <div className="import-modal image-import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="import-modal-header">
              <AlertTriangle size={24} className="import-modal-icon" />
              <h4>檔案已存在，是否覆蓋？</h4>
              <button type="button" className="close-btn" onClick={() => setImageOverwriteModal(null)}>
                <X size={18} />
              </button>
            </div>
            <p className="image-import-desc">以下圖檔已存在於題目圖片目錄，確認後將以新圖覆蓋原檔。</p>
            <ul className="image-import-list image-overwrite-list">
              {imageOverwriteModal.existing.map((item) => (
                <li key={item.name} className="image-import-item">
                  <span className="image-import-filename">{item.name}</span>
                  <span className="image-import-mtime">
                    原匯入時間：{item.mtime ? new Date(item.mtime).toLocaleString('zh-TW') : '—'}
                  </span>
                </li>
              ))}
            </ul>
            <div className="import-modal-actions">
              <Button variant="ghost" onClick={() => setImageOverwriteModal(null)}>
                取消
              </Button>
              <Button variant="primary" onClick={handleImageOverwriteConfirm}>
                確認覆蓋
              </Button>
            </div>
          </div>
        </div>
      )}

      {imageImportResult && (
        <div className={`import-result ${imageImportResult.success > 0 ? 'success' : 'error'}`}>
          <div className="result-header">
            {imageImportResult.success > 0 ? (
              <CheckCircle size={20} className="result-icon" />
            ) : (
              <AlertCircle size={20} className="result-icon" />
            )}
            <span className="result-title">
              {imageImportResult.success > 0 ? `已匯入 ${imageImportResult.success} 張圖片` : '匯入圖片失敗'}
            </span>
            <button className="close-btn" onClick={() => setImageImportResult(null)}>
              <X size={16} />
            </button>
          </div>
          {imageImportResult.errors && imageImportResult.errors.length > 0 && (
            <div className="result-errors">
              <ul>
                {imageImportResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
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

