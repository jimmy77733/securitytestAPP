# PDF題庫解析說明

## 當前狀況

由於PDF文件的格式複雜性，自動解析功能無法完美提取所有題目。PDF文本提取可能遇到以下問題：

1. **文本順序混亂**：PDF中的文本可能不是按照視覺順序排列
2. **格式不統一**：不同PDF文件的格式可能不同
3. **選項格式多樣**：選項可能使用不同的標記方式
4. **掃描版PDF**：如果是掃描版，需要OCR才能提取文本

## 解決方案

### 方案1：手動輸入題目（推薦）

1. 打開 `data/primary-questions.json` 或 `data/intermediate-questions.json`
2. 按照以下格式手動添加題目：

```json
{
  "id": "q_primary_108-2_1",
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
  "category": "資訊安全技術概論"
}
```

3. 保存文件後，執行 `npm run load-questions` 重新生成載入代碼

### 方案2：使用OCR工具

1. 使用OCR工具（如Adobe Acrobat、ABBYY FineReader等）將PDF轉換為文本
2. 將文本複製到文本編輯器
3. 手動整理成JSON格式

### 方案3：使用PDF轉Word工具

1. 使用PDF轉Word工具（如Adobe Acrobat、WPS等）
2. 在Word中編輯和整理題目
3. 轉換為JSON格式

## 題目格式要求

### 單選題範例

```json
{
  "id": "q_primary_108-2_1",
  "questionBank": "primary",
  "type": "single",
  "question": "關於資料在傳輸層使用TLS協定進行資料的保護，下列敘述何者「不」正確？",
  "options": [
    { "id": "opt_a", "text": "透過加密而能確保資訊的私密性" },
    { "id": "opt_b", "text": "藉由加密來確保訊息的完整性" },
    { "id": "opt_c", "text": "經由數位授權提供資料的真實性" },
    { "id": "opt_d", "text": "經由公開金鑰進行加解密的過程" }
  ],
  "correctAnswers": ["opt_c"],
  "year": "108-2",
  "category": "資訊安全技術概論"
}
```

### 多選題範例（中級題庫）

```json
{
  "id": "q_intermediate_109_1",
  "questionBank": "intermediate",
  "type": "multiple",
  "question": "某公司正準備規劃其識別及存取管理機制，下列何者是可選擇的存取控制類型？（複選）",
  "options": [
    { "id": "opt_a", "text": "強制存取控制（Mandatory Access Control, MAC）" },
    { "id": "opt_b", "text": "識別存取控制（Identity-Based Access Control, IBAC）" },
    { "id": "opt_c", "text": "規則基礎存取控制（Rule-Based Access Control, RuBAC）" },
    { "id": "opt_d", "text": "自主存取控制（Discretionary Access Control, DAC）" }
  ],
  "correctAnswers": ["opt_a", "opt_c", "opt_d"],
  "year": "109",
  "category": "資訊安全規劃實務"
}
```

## 注意事項

1. **ID唯一性**：確保每個題目的ID都是唯一的
2. **選項ID**：選項ID必須是 `opt_a`, `opt_b`, `opt_c`, `opt_d` 格式
3. **正確答案**：`correctAnswers` 必須是選項ID的陣列
4. **多選題**：中級題庫包含複選題，`type` 必須設為 `"multiple"`
5. **年份格式**：初級題庫使用 `108-2` 格式，中級題庫使用 `108` 格式

## 批量處理建議

1. 一次處理一個PDF文件
2. 先提取所有題目（不包含答案）
3. 再統一添加答案
4. 最後驗證格式

## 驗證工具

執行以下命令驗證題目格式：

```bash
npm run load-questions
```

如果格式正確，會生成 `src/data/questionBanks.ts` 文件。

## 題目統計

- **初級題庫**：26個PDF文件，每個約50題，共約1300題
- **中級題庫**：20個PDF文件，每個約40題，共約800題
- **總計**：約2100題

建議分批處理，每次處理一個PDF文件對應的題目。

