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

## 注意事項

1. 請先準備好 `data/primary-questions.json` 與 `data/intermediate-questions.json`
2. 題目格式請參考專案根目錄的 `題庫匯入指南.md`
