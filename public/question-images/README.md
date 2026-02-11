# 題目圖片管理說明

## 目錄結構

此目錄用於存放題目對應的圖片檔案。

## 圖片命名規則

圖片檔名必須與題目 ID 完全一致，副檔名為 `.png`、`.jpg` 或 `.jpeg`。

**範例：**
- 題目 ID：`q_intermediate_s_109_1_1`
- 圖片檔名：`q_intermediate_s_109_1_1.png`

## 使用流程

### 1. 放置圖片檔案

將圖片檔案放入此目錄（`public/question-images/`），檔名格式為：`{題目ID}.png`

### 2. 生成圖片清單（Manifest）

執行以下指令生成圖片清單：

```bash
npm run generate-image-manifest
```

或直接執行：

```bash
node scripts/generate-question-image-manifest.js
```

這會自動掃描此目錄中的所有圖片檔案，並生成 `manifest.json` 檔案。

### 3. 重新啟動應用

生成 manifest 後，重新啟動開發伺服器或重新建置應用，圖片功能即可使用。

## Manifest 檔案格式

生成的 `manifest.json` 格式如下：

```json
{
  "version": "1.0.0",
  "generatedAt": "2026-02-11T05:06:00.000Z",
  "imageIds": [
    "q_intermediate_s_109_1_1",
    "q_intermediate_s_109_1_2"
  ],
  "count": 2
}
```

## 功能說明

- **自動偵測**：應用啟動時會自動載入 manifest，建立圖片 ID 清單
- **最佳化查詢**：使用 Set 資料結構，查詢時間複雜度為 O(1)
- **預先計算**：在測驗或閱讀開始時，會預先計算哪些題目有圖片，避免重複查詢
- **顯示按鈕**：只有當題目有對應圖片時，才會顯示「顯示圖片」按鈕

## 注意事項

1. 圖片檔案必須放在 `public/question-images/` 目錄中
2. 每次新增或刪除圖片後，記得執行 `npm run generate-image-manifest` 更新清單
3. 圖片檔名必須與題目 ID 完全一致（大小寫敏感）
4. 支援的圖片格式：`.png`、`.jpg`、`.jpeg`
