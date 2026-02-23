# 題庫練習平台

專為高效學習設計的題庫練習平台，平衡「模擬考試的壓力感」與「練習模式的學習效率」。

## 功能特色

### 1. 使用者管理
- 多帳號切換：支援新增、刪除及名稱修改
- 個人化紀錄：每個使用者獨立的測試紀錄、收藏題目及設定

### 2. 測驗模式
- **標準模擬模式**：填答過程中不顯示對錯，可自由翻閱修改，完成後統一結算
- **即時檢誤模式**：選取答案後立即給予視覺反饋，幫助立即導正觀念

### 3. 題目年份篩選
- 開始測驗前可選擇「題目年份」，僅從該年份出題
- 預設為「不限制（全選隨機）」，從整個題庫隨機抽題

### 4. 題型支援
- **單選題**：圓形按鈕，點擊新選項自動取消舊選項
- **多選題**：方型按鈕，支援多選，檢查答案集合是否完全一致
- **題組題**（中級）：可設題組情境與多張題組圖片，作答時顯示「顯示題組題目」按鈕，以彈出視窗查看題組內容與題組圖片

### 5. 測試紀錄與成績
- 大尺寸成績顯示、及格狀態、答題耗時及正確率
- 篩選檢閱：全部 / 正確 / 錯誤切換
- 歷史清單：記錄模式類型、得分、日期，可回溯查看詳情

### 6. 閱讀模式
- 列表式呈現所有題目與答案解析
- 收藏機制：每題可收藏，獨立分頁查看
- 可依題庫切換（初級 / 中級等）

### 7. 題庫管理（匯入 / 匯出）
- **匯入**：從 JSON 檔案匯入題目至指定題庫
- **匯出**：將目前題庫匯出為 JSON 備份或分享
- 題目格式與驗證、載入步驟請見 [題庫匯入指南.md](./題庫匯入指南.md)

### 8. 無題目提醒
- 若尚未匯入題目即點擊「開始測驗」，會提示「尚未匯入題目，請先新增或匯入題目後再開始測驗。」

## 技術棧

- **前端**：React 18 + TypeScript
- **狀態管理**：Zustand
- **路由**：React Router v6
- **動畫**：Framer Motion
- **圖標**：Lucide React
- **建置**：Vite

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

### 打包成執行檔（可攜式發佈）

專案可建置為 **Windows 單一執行檔**，只要把執行檔與必要檔案放在同一資料夾，即可在未安裝 Node.js 的電腦上執行。

1. **安裝依賴並建置執行檔**（需先安裝 [pkg](https://www.npmjs.com/package/pkg)，
   已列在 `devDependencies`）：

   ```bash
   npm install
   npm run pack:full
   ```

   - `pack`：只建置前端並用 pkg 產生 `dist-portable/題庫平台.exe`
   - `pack:full`：建置執行檔後，再將 `dist/` 與 `public/` 複製到 `dist-portable/`，形成完整可攜包

2. **發佈資料夾結構**（整個 `dist-portable` 資料夾即為可攜包）：

   ```
   dist-portable/
   ├── 題庫平台.exe    # 雙擊執行，會自動開啟瀏覽器
   ├── dist/           # 前端靜態檔（由 pack:full 複製）
   └── public/         # 題組圖片等（由 pack:full 複製）
       └── question-images/
   ```

3. **使用方式**：將 `dist-portable` 整個資料夾複製到任意位置（或壓縮成 zip 分享），在該資料夾內雙擊 `題庫平台.exe`，程式會啟動本機伺服器並自動開啟瀏覽器至 `http://localhost:4173`。關閉主控台視窗即停止伺服器。

4. **僅用 Node 執行（不打包）**：若已建置過 `dist`，可直接用獨立伺服器啟動，行為與執行檔相同：

   ```bash
   npm run build
   npm run start:standalone
   ```

   環境變數：`PORT` 可指定埠號（預設 4173）；`OPEN_BROWSER=0` 可關閉自動開瀏覽器。

**關於「單一程式檔案」**：目前做法是「一個執行檔 + 同資料夾的 `dist`、`public`」，整包以一個資料夾形式發佈。若需要真正單一 .exe（內嵌前端與圖片），可考慮使用 Electron 或 Tauri 將整個應用包成桌面程式，或使用 pkg 的 assets 將靜態檔內嵌進 exe（需額外設定與解壓邏輯）。

## 題庫匯入

題庫以 JSON 格式存放於 `data/` 目錄，透過以下流程載入：

1. 編輯 `data/primary-questions.json`、`data/intermediate-questions.json`
2. 執行格式驗證：`npm run validate-questions`
3. 生成載入代碼：`npm run load-questions`（會產生 `src/data/questionBanks.ts`）
4. 啟動應用後會自動載入題庫

題目格式範例與欄位說明請見 [題庫匯入指南.md](./題庫匯入指南.md)。初階題目可依科目在 id 尾號前加 `_m_`（資訊安全管理概論）或 `_s_`（資訊安全技術概論）以區分題目圖片；題組題格式見 [題庫匯入說明.md](./題庫匯入說明.md) 與 `src/data/questionGroupFormatSample.json`。  
應用內也可在首頁「題庫管理」透過 JSON 檔案匯入題目，或匯出目前題庫。

## 專案結構

```
src/
├── components/       # 共用組件
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── OptionButton.tsx
│   ├── QuestionBankSelector.tsx
│   └── ImportExportPanel.tsx
├── pages/           # 頁面
│   ├── UserSelection.tsx
│   ├── Home.tsx
│   ├── TestSetup.tsx
│   ├── Test.tsx
│   ├── Result.tsx
│   ├── Reading.tsx
│   └── Records.tsx
├── store/           # 狀態（Zustand）
│   ├── userStore.ts
│   ├── bankStore.ts
│   ├── questionStore.ts
│   ├── testStore.ts
│   └── favoriteStore.ts
├── types/           # TypeScript 類型
│   └── index.ts
├── utils/           # 工具
│   ├── importExport.ts   # 匯入 / 匯出題庫
│   ├── questionLoader.ts  # 題庫載入
│   ├── questionUtils.ts
│   └── initApp.ts
├── data/            # 題庫載入碼（由腳本生成）
│   └── questionBanks.ts
└── styles/
    └── globals.css
```

## 設計特色

- 極簡風格、大留白、無邊框卡片
- 中性色背景，主色為科技藍；正確為綠、錯誤為紅
- 正確 / 錯誤即時視覺反饋，題目切換平滑動畫

## 開發注意事項

1. **資料持久化**：使用 Zustand 的 persist 中間件，資料儲存在 localStorage
2. **題庫格式**：中級題庫含複選題，需正確設定 `type` 與 `correctAnswers`
3. **題目年份**：題目可帶 `year` 欄位，測驗時可依年份篩選出題範圍

## 授權

MIT License
