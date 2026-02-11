/**
 * 題目圖片管理工具
 * 
 * 功能：
 * 1. 載入圖片 manifest（有圖片的題目 ID 清單）
 * 2. 提供查詢功能：檢查題目是否有對應圖片
 * 3. 提供圖片 URL 生成功能
 * 
 * 最佳化：
 * - manifest 只在應用啟動時載入一次
 * - 使用 Set 進行 O(1) 查詢
 */

interface ImageManifest {
  version: string;
  generatedAt: string;
  imageIds: string[];
  count: number;
}

let imageIdSet: Set<string> | null = null;
let manifestLoaded = false;

/**
 * 載入圖片 manifest
 * 如果 manifest.json 不存在，返回空 Set（不會報錯）
 */
async function loadImageManifest(): Promise<Set<string>> {
  if (manifestLoaded && imageIdSet !== null) {
    return imageIdSet;
  }

  try {
    const response = await fetch('/question-images/manifest.json');
    if (!response.ok) {
      // manifest 不存在或無法讀取，返回空 Set
      console.warn('圖片 manifest 不存在或無法讀取，將不顯示圖片功能');
      imageIdSet = new Set<string>();
      manifestLoaded = true;
      return imageIdSet;
    }

    const manifest: ImageManifest = await response.json();
    imageIdSet = new Set(manifest.imageIds || []);
    manifestLoaded = true;
    
    console.log(`✅ 已載入圖片清單：${imageIdSet.size} 個題目有圖片`);
    return imageIdSet;
  } catch (error) {
    console.warn('載入圖片 manifest 失敗，將不顯示圖片功能:', error);
    imageIdSet = new Set<string>();
    manifestLoaded = true;
    return imageIdSet;
  }
}

/**
 * 檢查題目是否有對應圖片
 * @param questionId 題目 ID
 * @returns 是否有圖片
 */
export async function hasQuestionImage(questionId: string): Promise<boolean> {
  if (!manifestLoaded) {
    await loadImageManifest();
  }
  return imageIdSet?.has(questionId) ?? false;
}

/**
 * 同步檢查題目是否有對應圖片（需先確保 manifest 已載入）
 * @param questionId 題目 ID
 * @returns 是否有圖片
 */
export function hasQuestionImageSync(questionId: string): boolean {
  if (!manifestLoaded || imageIdSet === null) {
    console.warn('圖片 manifest 尚未載入，請先呼叫 loadImageManifest()');
    return false;
  }
  return imageIdSet.has(questionId);
}

/**
 * 取得題目的圖片 URL
 * @param questionId 題目 ID
 * @returns 圖片 URL
 */
export function getQuestionImageUrl(questionId: string): string {
  return `/question-images/${questionId}.png`;
}

/**
 * 預先載入 manifest（建議在 App 啟動時呼叫）
 */
export async function preloadImageManifest(): Promise<void> {
  await loadImageManifest();
}

/**
 * 從題目陣列中篩選出有圖片的題目 ID，並返回 Set
 * 時間複雜度：O(n)，n = 題目數量
 * 空間複雜度：O(k)，k = 有圖片的題目數量（通常 k << n）
 * 
 * @param questions 題目陣列
 * @returns 有圖片的題目 ID Set
 */
export async function getQuestionIdsWithImages(questions: Array<{ id: string }>): Promise<Set<string>> {
  if (!manifestLoaded) {
    await loadImageManifest();
  }

  const result = new Set<string>();
  if (imageIdSet === null || imageIdSet.size === 0) {
    return result;
  }

  // 一次遍歷，O(n)
  for (const question of questions) {
    if (imageIdSet.has(question.id)) {
      result.add(question.id);
    }
  }

  return result;
}

/**
 * 同步版本：從題目陣列中篩選出有圖片的題目 ID（需先確保 manifest 已載入）
 */
export function getQuestionIdsWithImagesSync(questions: Array<{ id: string }>): Set<string> {
  const result = new Set<string>();
  if (imageIdSet === null || imageIdSet.size === 0) {
    return result;
  }

  for (const question of questions) {
    if (imageIdSet.has(question.id)) {
      result.add(question.id);
    }
  }

  return result;
}
