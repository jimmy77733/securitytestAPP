# 題庫腳本說明

## 指令速查

| 用途 | 指令 |
|------|------|
| **題目 ID 前贅詞（科目區分）** | `node scripts/update-all-category-id-prefix.mjs` |
| **題組格式（重複 key 合併）** | `node scripts/fix-question-group-duplicate-keys.mjs <JSON路徑> [第二段description內容]` |

詳見下方各節說明。

---

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

## 題目 ID 前贅詞（科目區分）

若需依科目在題目 id 尾號前加入前贅詞，可執行：

```bash
node scripts/update-all-category-id-prefix.mjs
```

會掃描 `src/data/banks/*.json`，規則如下，已含對應前贅詞者會略過：

- **初級**：`資訊安全管理概論` → `_m_`；`資訊安全技術概論` → `_s_`（例：`q_primary_114-1_m_5`）
- **中級**：`資訊安全防護實務` → `_p_`；`資訊安全規劃實務` → `_o_`（例：`q_intermediate_108-1_p_1`、`q_intermediate_108-1_o_1`）

## 題組格式（重複 key 合併）

若某題庫 JSON 內**同一層出現兩組** `description`、`questionGroups`、`questions`（例如兩個科目寫成兩塊），會造成 Duplicate object key，需合併成單一物件。可執行：

```bash
node scripts/fix-question-group-duplicate-keys.mjs <JSON 檔案路徑> [第二段 description 內容]
```

- **JSON 檔案路徑**：相對於專案根目錄，例如 `src/data/banks/q_intermediate_108-1.json`。
- **第二段 description 內容**：檔案裡「第二組」`description` 的完整字串（用來定位從哪裡切開）。若省略，腳本會用預設值（僅適用 108 科目1 那筆）。

**範例：**

```bash
# 修正 q_intermediate_108-1.json（可省略第二參數，用預設）
node scripts/fix-question-group-duplicate-keys.mjs src/data/banks/q_intermediate_108-1.json

# 若另一檔案也有同樣問題，請帶入該檔案「第二段」的 description 內容
node scripts/fix-question-group-duplicate-keys.mjs src/data/banks/q_intermediate_109-1.json "109年度中級資訊安全工程師能力鑑定試題 - 科目1:資訊安全規劃實務"
```

合併後會產生單一物件：`description` 為兩段用「；」相接，`questionGroups` 與 `questions` 為兩邊陣列合併。

## 注意事項

1. 請先準備好 `data/primary-questions.json` 與 `data/intermediate-questions.json`
2. 題目格式請參考專案根目錄的 `題庫匯入指南.md`
