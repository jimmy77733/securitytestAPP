# 題庫練習平台

一個專為高效學習設計的題庫練習平台，平衡「模擬考試的壓力感」與「練習模式的學習效率」。

## 功能特色

### 1. 使用者管理模組
- 多帳號切換：支援新增、刪除及名稱修改
- 個人化紀錄：每個使用者獨立的測試紀錄、收藏題目及設定

### 2. 測驗模式模組
- **標準模擬模式**：填答過程中不顯示對錯，可自由翻閱修改，完成後統一結算
- **即時檢誤模式**：選取答案後立即給予視覺反饋，幫助立即導正觀念

### 3. 題型判斷邏輯
- **單選題**：圓形按鈕，點擊新選項自動取消舊選項
- **多選題**：方型按鈕，支援多選，檢查答案集合是否完全一致

### 4. 測試紀錄與成績面板
- 大尺寸成績顯示、及格狀態、答題耗時及正確率
- 篩選檢閱：全部/正確/錯誤切換
- 歷史清單：記錄模式類型、得分、日期，可回溯查看詳情

### 5. 閱讀模式模組
- 列表式呈現所有題目與答案解析
- 收藏機制：每題可收藏，獨立分頁查看
- 快速切換：選擇題庫功能，方便在不同專業領域間跳轉

## 技術棧

- **前端框架**：React 18 + TypeScript
- **狀態管理**：Zustand
- **路由**：React Router v6
- **動畫**：Framer Motion
- **圖標**：Lucide React
- **建置工具**：Vite

## 安裝與執行

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

### 建置生產版本

```bash
npm run build
```

### 預覽生產版本

```bash
npm run preview
```

## 題庫匯入

系統支援從JSON格式匯入題目。題目格式範例：

```json
[
  {
    "id": "q_1",
    "questionBank": "primary",
    "type": "single",
    "question": "題目內容",
    "options": [
      { "id": "opt_1", "text": "選項1" },
      { "id": "opt_2", "text": "選項2" },
      { "id": "opt_3", "text": "選項3" },
      { "id": "opt_4", "text": "選項4" }
    ],
    "correctAnswers": ["opt_1"],
    "explanation": "解析說明",
    "year": "2024",
    "category": "分類名稱"
  }
]
```

### PDF題庫處理

系統預設支援PDF題庫（位於 `初級題庫` 和 `中級題庫` 資料夾），但需要實作PDF解析功能。建議：

1. 使用 `pdf-parse` 或 `pdfjs-dist` 庫解析PDF
2. 根據PDF格式實作解析邏輯
3. 將解析結果轉換為上述JSON格式
4. 使用 `loadQuestionBankFromJSON` 函數載入題目

## 專案結構

```
src/
├── components/       # 共用組件
│   ├── Button.tsx
│   ├── Card.tsx
│   └── OptionButton.tsx
├── pages/           # 頁面組件
│   ├── UserSelection.tsx
│   ├── Home.tsx
│   ├── TestSetup.tsx
│   ├── Test.tsx
│   ├── Result.tsx
│   ├── Reading.tsx
│   └── Records.tsx
├── store/           # 狀態管理
│   ├── userStore.ts
│   ├── testStore.ts
│   ├── favoriteStore.ts
│   └── questionStore.ts
├── types/           # TypeScript 類型定義
│   └── index.ts
├── utils/           # 工具函數
│   ├── questionUtils.ts
│   ├── pdfParser.ts
│   └── questionLoader.ts
└── styles/          # 樣式文件
    └── globals.css
```

## 設計特色

### 視覺風格
- 極簡主義、大留白、無邊框設計
- 中性色背景（#F5F7FA），卡片為純白色
- 主視覺採用科技藍（#3498DB）
- 正確使用森林綠（#27AE60），錯誤使用警示紅（#E74C3C）

### 互動效果
- 正確反饋：題目卡片外框閃爍綠光，確認按鈕轉化為下一題並帶有縮放動畫
- 錯誤反饋：題目卡片左右水平抖動，選錯的選項變紅，正確答案自動亮起
- 平滑動畫：題目切換採用平滑推移效果

## 開發注意事項

1. **PDF解析**：目前PDF解析功能尚未完全實作，需要根據實際PDF格式進行調整
2. **資料持久化**：使用Zustand的persist中間件，資料儲存在localStorage
3. **題庫格式**：中級題庫包含複選題，需特別注意判斷邏輯

## 授權

MIT License

