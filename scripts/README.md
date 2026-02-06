# PDF題庫解析腳本

## 使用說明

### 1. 安裝依賴

```bash
npm install
```

### 2. 解析PDF題庫

執行以下命令來解析所有PDF文件：

```bash
npm run parse-pdf
```

或者直接使用 tsx：

```bash
npx tsx scripts/parsePdf.ts
```

### 3. 生成題庫載入代碼

解析完成後，執行：

```bash
npx tsx scripts/loadQuestions.ts
```

這會生成 `src/data/questionBanks.ts` 文件，包含所有題目數據。

### 4. 驗證題目

腳本會自動驗證題目格式，檢查：
- 題目文字是否足夠長
- 選項數量是否足夠
- 正確答案是否存在
- 多選題標記是否正確

## 輸出文件

- `data/primary-questions.json` - 初級題庫JSON文件
- `data/intermediate-questions.json` - 中級題庫JSON文件
- `src/data/questionBanks.ts` - 題庫載入代碼

## 注意事項

1. PDF解析依賴於PDF文件的格式，如果格式不標準，可能需要調整解析邏輯
2. 答案提取可能不準確，建議手動檢查並修正
3. 多選題的判斷基於答案數量或題目中的關鍵字（如"複選"、"多選"）
4. 如果解析結果不理想，可以手動編輯JSON文件進行修正

## 手動修正題目

如果發現題目有問題，可以：

1. 編輯 `data/primary-questions.json` 或 `data/intermediate-questions.json`
2. 重新執行 `loadQuestions.ts` 生成新的載入代碼
3. 或者直接在生成的 `questionBanks.ts` 文件中修改

