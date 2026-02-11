# 題庫腳本說明

## 使用方式

題庫以 JSON 格式存放於 `data/` 目錄，透過以下腳本驗證與生成載入代碼。

### 1. 驗證題目格式

```bash
npm run validate-questions
```

會檢查 `data/primary-questions.json` 與 `data/intermediate-questions.json` 的格式是否正確。

### 2. 生成載入代碼

```bash
npm run load-questions
```

會讀取上述 JSON 並生成 `src/data/questionBanks.ts`，應用啟動時會自動載入題庫。

## 輸出檔案

- `src/data/questionBanks.ts`：題庫載入代碼（由腳本生成）

## 匯入圖片 API

匯入圖片功能在以下兩種方式下皆可使用，不限定開發環境：

- **開發**：`npm run dev`（Vite 內建 API）
- **生產**：先執行 `npm run build`，再執行 `npm run start`（會啟動靜態伺服器並提供相同 API）

`scripts/server.mjs` 會提供靜態檔與 `/api/check-question-images`、`/api/save-question-images`，圖片會寫入 `public/question-images`。

## 注意事項

1. 請先準備好 `data/primary-questions.json` 與 `data/intermediate-questions.json`
2. 題目格式請參考專案根目錄的 `題庫匯入指南.md`
