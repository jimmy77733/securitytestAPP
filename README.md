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

### 9. 同步建置
- 首頁右上角提供**同步建置**按鈕（重新整理圖示）。在**開發模式**（`npm run dev`）、**獨立伺服器**（`npm run start:standalone`）或**執行檔**（`題庫平台.exe`）環境下，點擊後會於伺服器端執行 `npm run build`，完成後提示重新整理頁面以載入最新版本。開發時也可用來快速產出 `dist/` 而不必手動下指令。

### 10. 可攜式執行檔（Windows / macOS）
- **Windows**：可建置為單一執行檔 `題庫平台.exe`，與 `dist/`、`public/` 同資料夾即可在未安裝 Node.js 的電腦上執行。
- **macOS（Macbook）**：可建置為 Mac 執行檔（Intel 與 Apple Silicon 各一），同樣與 `dist/`、`public/` 同資料夾即可執行；詳見下方「打包成執行檔」一節。

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

專案可建置為 **Windows** 或 **macOS（Macbook）** 可攜式執行檔，只要把執行檔與必要檔案放在同一資料夾，即可在未安裝 Node.js 的電腦上執行。

1. **安裝依賴**（[pkg](https://www.npmjs.com/package/pkg) 已列在 `devDependencies`）：

   ```bash
   npm install
   ```

2. **建置 Windows 版**（於 Windows 或任何平台皆可建置）：

   ```bash
   npm run pack:full
   ```

   - `pack`：建置前端並用 pkg 產生 `dist-portable/題庫平台.exe`，並套用隱藏主控台
   - `pack:full`：建置 Windows 執行檔後，再將 `dist/` 與 `public/` 複製到 `dist-portable/`，形成完整可攜包

3. **建置 macOS 版**（於 Mac、Windows 或 Linux 皆可建置，產出給 Mac 使用）：

   ```bash
   npm run pack:full:mac
   ```

   - `pack:mac`：建置前端並用 pkg 產生 Mac 執行檔（Intel：`題庫平台-macos-x64`、Apple Silicon：`題庫平台-macos-arm64`）
   - `pack:full:mac`：建置 Mac 執行檔後，再將 `dist/` 與 `public/` 複製到 `dist-portable/`，形成完整可攜包

4. **發佈資料夾結構**（整個 `dist-portable` 資料夾即為可攜包）：

   **Windows 可攜包**（執行 `pack:full` 後）：
   ```
   dist-portable/
   ├── 題庫平台.exe    # 雙擊執行，會自動開啟瀏覽器（不顯示主控台）
   ├── dist/
   └── public/
       └── question-images/
   ```

   **macOS 可攜包**（執行 `pack:full:mac` 後）：
   ```
   dist-portable/
   ├── 題庫平台-macos-x64     # Intel Mac 使用
   ├── 題庫平台-macos-arm64   # Apple Silicon（M1/M2/M3）使用
   ├── dist/
   └── public/
       └── question-images/
   ```

5. **使用方式**：
   - **Windows**：將 `dist-portable` 整個資料夾複製到任意位置，在該資料夾內雙擊 `題庫平台.exe`，程式會啟動本機伺服器並自動開啟瀏覽器至 `http://localhost:4173`。關閉程式請從工作管理員結束「題庫平台.exe」。
   - **macOS**：將 `dist-portable` 整個資料夾複製到 Mac，在終端機進入該資料夾後執行：
     - **Apple Silicon（M1/M2/M3）**：`./題庫平台-macos-arm64`
     - **Intel**：`./題庫平台-macos-x64`  
     首次執行前請先賦予執行權限：`chmod +x 題庫平台-macos-arm64`（或 `題庫平台-macos-x64`）。程式會啟動本機伺服器並自動開啟瀏覽器至 `http://localhost:4173`。於終端機按 `Ctrl+C` 可停止伺服器。

6. **僅用 Node 執行（不打包）**：若已建置過 `dist`，可直接用獨立伺服器啟動，行為與執行檔相同：

   ```bash
   npm run build
   npm run start:standalone
   ```

   環境變數：`PORT` 可指定埠號（預設 4173）；`OPEN_BROWSER=0` 可關閉自動開瀏覽器。

**關於「單一程式檔案」**：目前做法是「一個執行檔 + 同資料夾的 `dist`、`public`」，整包以一個資料夾形式發佈。若需要真正單一檔案內嵌前端與圖片，可考慮使用 Electron 或 Tauri 將整個應用包成桌面程式。

#### 執行檔用途與更新方式（Windows / macOS 共用）

- **用途**：執行檔會啟動本機 HTTP 伺服器，並（可選）自動開啟預設瀏覽器連到 `http://localhost:4173`。實際操作介面在瀏覽器內，執行檔只負責提供網頁與 API，不內建視窗程式。
- **更新內容**：執行檔**不會**把前端或題庫包進執行檔，每次執行都是從「與執行檔同一個資料夾」讀取 `dist/`、`public/`。因此只要在該資料夾內替換成新的 `dist`、`public`（例如重新建置後覆蓋），下次執行同一個執行檔就會使用新內容。
- **資料儲存**：使用者帳號、測驗紀錄、收藏等皆儲存在**本機瀏覽器的 localStorage**，不會上傳到遠端。同一台電腦、同一瀏覽器會保留資料；換電腦或換瀏覽器則是另一份本機資料。

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
