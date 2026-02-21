/**
 * 題目出題率：依題目內容相似度（80%）判斷跨年份重複，以最小年份為基準、避免重複紀錄。
 */

import type { Question } from '@/types';

const SIMILARITY_THRESHOLD = 0.8;

/** 正規化題目文字（去空白、全形等） */
function normalizeText(s: string): string {
  return (s || '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 計算兩段文字相似度 0~1（字元多重集 Jaccard 概念，≥ 0.8 視為重複）
 */
export function textSimilarity(a: string, b: string): number {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na.length === 0 && nb.length === 0) return 1;
  if (na.length === 0 || nb.length === 0) return 0;

  const charsA = na.split('');
  const charsB = nb.split('');
  const countA = new Map<string, number>();
  const countB = new Map<string, number>();
  for (const c of charsA) countA.set(c, (countA.get(c) ?? 0) + 1);
  for (const c of charsB) countB.set(c, (countB.get(c) ?? 0) + 1);

  let intersection = 0;
  for (const [c, n] of countA) {
    intersection += Math.min(n, countB.get(c) ?? 0);
  }
  const total = charsA.length + charsB.length;
  return total === 0 ? 0 : (2 * intersection) / total;
}

export interface FrequencyItem {
  canonicalId: string;
  years: string[];
  count: number;
  questionIds: string[];
}

export interface FrequencyByCategory {
  [category: string]: {
    items: FrequencyItem[];
  };
}

export interface FrequencyResult {
  lastSyncedAt: string;
  byCategory: FrequencyByCategory;
}

/**
 * 以「年份最小」的題目為起點，找出跨年份 80% 相似的題目群組，每組只紀錄一次（後續年份的重複題略過）。
 * 僅回傳出現 2 次以上的群組。
 */
export function computeFrequencyByCategory(questions: Question[]): FrequencyByCategory {
  const byCategory = new Map<string, Question[]>();
  for (const q of questions) {
    const cat = q.category ?? '';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(q);
  }

  const result: FrequencyByCategory = {};

  byCategory.forEach((list, category) => {
    const sorted = [...list].sort((a, b) => {
      const ya = a.year ?? '';
      const yb = b.year ?? '';
      if (ya !== yb) return ya.localeCompare(yb);
      return (a.id ?? '').localeCompare(b.id ?? '');
    });

    const visited = new Set<string>();
    const items: FrequencyItem[] = [];

    for (const q of sorted) {
      if (visited.has(q.id)) continue;

      const similar: Question[] = [q];
      for (const other of sorted) {
        if (other.id === q.id) continue;
        if (visited.has(other.id)) continue;
        if (textSimilarity(q.question, other.question) >= SIMILARITY_THRESHOLD) {
          similar.push(other);
        }
      }

      for (const s of similar) visited.add(s.id);

      if (similar.length >= 2) {
        const years = [...new Set(similar.map((s) => s.year ?? '').filter(Boolean))].sort();
        items.push({
          canonicalId: q.id,
          years,
          count: similar.length,
          questionIds: similar.map((s) => s.id),
        });
      }
    }

    if (items.length > 0) result[category] = { items };
  });

  return result;
}

const STORAGE_KEY_PREFIX = 'questionFrequency_';

export function getStoredFrequency(bank: string): FrequencyResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + bank);
    if (!raw) return null;
    return JSON.parse(raw) as FrequencyResult;
  } catch {
    return null;
  }
}

export function setStoredFrequency(bank: string, byCategory: FrequencyByCategory): FrequencyResult {
  const result: FrequencyResult = {
    lastSyncedAt: new Date().toISOString(),
    byCategory,
  };
  try {
    const json = JSON.stringify(result);
    localStorage.setItem(STORAGE_KEY_PREFIX + bank, json);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (typeof message !== 'string' || message.length === 0) {
      throw new Error('無法寫入出題率資料，請檢查瀏覽器儲存空間或隱私設定。');
    }
    throw new Error(`儲存失敗：${message}`);
  }
  return result;
}

/** 取得該題庫、類別下「出現 2 次以上」的題目 ID 集合 */
export function getHighFrequencyQuestionIds(
  stored: FrequencyResult | null,
  category: string
): Set<string> {
  const ids = new Set<string>();
  if (!stored?.byCategory[category]?.items) return ids;
  for (const item of stored.byCategory[category].items) {
    for (const id of item.questionIds) ids.add(id);
  }
  return ids;
}

/** 取得單一題目的出題率資訊（出現次數與年份），若不在任何高出題率群組則回傳 null */
export function getFrequencyInfoForQuestion(
  stored: FrequencyResult | null,
  questionId: string
): { count: number; years: string[] } | null {
  if (!stored?.byCategory) return null;
  for (const category of Object.keys(stored.byCategory)) {
    const items = stored.byCategory[category]?.items ?? [];
    for (const item of items) {
      if (item.questionIds.includes(questionId)) {
        return { count: item.count, years: item.years ?? [] };
      }
    }
  }
  return null;
}
