import type { Question, QuestionBank } from '@/types';
import { useQuestionStore } from '@/store/questionStore';

/**
 * 從題目 id 取得前贅詞（對應檔案名）
 * 例：q_primary_108-2_1 → q_primary_108-2
 */
export function getQuestionIdPrefix(id: string): string {
  return id.replace(/_(\d+)$/, '');
}

export interface DuplicateInfo {
  duplicateIds: string[];
  details: Array<{
    id: string;
    existing: Question;
    incoming: Question;
    diffSummary: string;
  }>;
}

/**
 * 檢查匯入資料與「指定現有題目」的重複 ID 與差異（用於依前贅詞比對）
 */
export function getImportDuplicateInfoWithExisting(
  incomingQuestions: Question[],
  existingQuestions: Question[]
): DuplicateInfo | null {
  const existingMap = new Map(existingQuestions.map((q) => [q.id, q]));
  const duplicateIds: string[] = [];
  const details: DuplicateInfo['details'] = [];

  incomingQuestions.forEach((q) => {
    if (!q.id) return;
    const existing = existingMap.get(q.id);
    if (!existing) return;
    duplicateIds.push(q.id);
    const diffParts: string[] = [];
    if (existing.question !== q.question) diffParts.push('題目文字不同');
    if (
      JSON.stringify([...(existing.correctAnswers ?? [])].sort()) !==
      JSON.stringify([...(q.correctAnswers ?? [])].sort())
    )
      diffParts.push('正確答案不同');
    if (existing.explanation !== (q.explanation ?? '')) diffParts.push('解析不同');
    if (existing.year !== (q.year ?? '')) diffParts.push('年份不同');
    if (existing.category !== (q.category ?? '')) diffParts.push('分類不同');
    details.push({
      id: q.id,
      existing,
      incoming: q,
      diffSummary: diffParts.length ? diffParts.join('、') : '內容相同',
    });
  });

  if (duplicateIds.length === 0) return null;
  return { duplicateIds, details };
}

/**
 * 檢查匯入資料與現有題庫的重複 ID 與差異（全題庫）
 */
export function getImportDuplicateInfo(
  questions: Question[],
  targetBank: QuestionBank | string
): DuplicateInfo | null {
  const { getQuestions } = useQuestionStore.getState();
  const existingQuestions = getQuestions(targetBank as QuestionBank);
  return getImportDuplicateInfoWithExisting(questions, existingQuestions);
}

export interface ImportOptions {
  overwriteDuplicates?: boolean;
}

function validateOne(
  question: Question,
  index: number
): { ok: true; q: Question } | { ok: false; error: string } {
  if (!question.id) {
    return { ok: false, error: `題目 ${index + 1}: 缺少ID` };
  }
  if (!question.question || question.question.length < 5) {
    return { ok: false, error: `題目 ${index + 1}: 題目文字過短或缺失` };
  }
  if (!question.options || question.options.length < 2) {
    return { ok: false, error: `題目 ${index + 1}: 選項不足（至少需要2個）` };
  }
  if (!question.correctAnswers || question.correctAnswers.length === 0) {
    return { ok: false, error: `題目 ${index + 1}: 缺少正確答案` };
  }
  const optionIds = new Set(question.options.map((opt) => opt.id));
  const invalid = (question.correctAnswers ?? []).filter((id) => !optionIds.has(id));
  if (invalid.length > 0) {
    return { ok: false, error: `題目 ${index + 1}: 答案 ${invalid.join(', ')} 不在選項中` };
  }
  const validQuestion: Question = {
    ...question,
    questionBank: question.questionBank ?? 'primary',
  };
  return { ok: true, q: validQuestion };
}

/**
 * 僅驗證題目格式，回傳通過的題目與錯誤列表（供匯入前依前贅詞檢查重複用）
 */
export function validateQuestions(
  questions: Question[],
  targetBank: QuestionBank | string
): { validated: Question[]; errors: string[] } {
  const validated: Question[] = [];
  const errors: string[] = [];
  questions.forEach((q, i) => {
    const v = validateOne(q, i);
    if (v.ok) {
      validated.push({ ...v.q, questionBank: targetBank as QuestionBank });
    } else {
      errors.push(v.error);
    }
  });
  return { validated, errors };
}

/**
 * 依前贅詞檢查匯入資料與現有題庫的重複（僅針對「同前贅詞」的現有題目）
 * 回傳合併後的重複資訊，若有任一同前贅詞檔案內有重複 ID 即納入
 */
export function getImportDuplicateInfoByPrefix(
  validatedQuestions: Question[],
  targetBank: QuestionBank | string
): DuplicateInfo | null {
  const { getQuestions } = useQuestionStore.getState();
  const existingAll = getQuestions(targetBank as QuestionBank);

  const prefixOrder: string[] = [];
  const seen = new Set<string>();
  for (const q of validatedQuestions) {
    if (!q.id) continue;
    const p = getQuestionIdPrefix(q.id);
    if (!seen.has(p)) {
      seen.add(p);
      prefixOrder.push(p);
    }
  }

  const allDuplicateIds: string[] = [];
  const allDetails: DuplicateInfo['details'] = [];

  for (const prefix of prefixOrder) {
    const incomingForPrefix = validatedQuestions.filter((q) => getQuestionIdPrefix(q.id) === prefix);
    const existingForPrefix = existingAll.filter((q) => getQuestionIdPrefix(q.id) === prefix);
    if (existingForPrefix.length === 0) continue;
    const dup = getImportDuplicateInfoWithExisting(incomingForPrefix, existingForPrefix);
    if (dup) {
      allDuplicateIds.push(...dup.duplicateIds);
      allDetails.push(...dup.details);
    }
  }

  if (allDuplicateIds.length === 0) return null;
  return { duplicateIds: allDuplicateIds, details: allDetails };
}

/**
 * 依前贅詞匯入：先判斷前贅詞 → 無相關則新增 → 有則依覆蓋選項合併，新題目依序排在後面
 */
export function importQuestionsByPrefix(
  questions: Question[],
  targetBank: QuestionBank | string,
  options?: ImportOptions
): {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
} {
  const { getQuestions, loadQuestions } = useQuestionStore.getState();
  const overwrite = options?.overwriteDuplicates ?? false;
  const result = { success: 0, failed: 0, duplicates: 0, errors: [] as string[] };

  const validated: Question[] = [];
  questions.forEach((q, i) => {
    const v = validateOne(q, i);
    if (v.ok) {
      validated.push({ ...v.q, questionBank: targetBank as QuestionBank });
      result.success++;
    } else {
      result.failed++;
      result.errors.push(v.error);
    }
  });

  if (validated.length === 0) {
    return result;
  }

  let existing = getQuestions(targetBank as QuestionBank);
  const existingIds = new Set(existing.map((q) => q.id));

  const prefixOrder: string[] = [];
  const seenPrefix = new Set<string>();
  for (const q of validated) {
    const p = getQuestionIdPrefix(q.id);
    if (!seenPrefix.has(p)) {
      seenPrefix.add(p);
      prefixOrder.push(p);
    }
  }

  let resultList = [...existing];

  for (const prefix of prefixOrder) {
    const incomingForPrefix = validated.filter((q) => getQuestionIdPrefix(q.id) === prefix);
    const existingForPrefix = resultList.filter((q) => getQuestionIdPrefix(q.id) === prefix);

    if (existingForPrefix.length === 0) {
      for (const q of incomingForPrefix) {
        if (existingIds.has(q.id)) {
          result.duplicates++;
          continue;
        }
        resultList.push(q);
        existingIds.add(q.id);
      }
    } else {
      const duplicateIds = incomingForPrefix.filter((q) => existingIds.has(q.id)).map((q) => q.id);
      if (duplicateIds.length > 0) result.duplicates += duplicateIds.length;
      if (overwrite) {
        resultList = resultList.filter((q) => !duplicateIds.includes(q.id));
        duplicateIds.forEach((id) => existingIds.delete(id));
        for (const q of incomingForPrefix) {
          resultList.push(q);
          existingIds.add(q.id);
        }
      } else {
        for (const q of incomingForPrefix) {
          if (existingIds.has(q.id)) continue;
          resultList.push(q);
          existingIds.add(q.id);
        }
      }
    }
  }

  loadQuestions(targetBank as QuestionBank, resultList);

  if (result.duplicates > 0 && !overwrite) {
    result.errors.push(
      `跳過 ${result.duplicates} 個重複的題目ID（可選擇「覆蓋並匯入」以覆蓋）`
    );
  }
  return result;
}

/**
 * 匯入題庫（全題庫比對重複，不依前贅詞分檔）
 * @param questions 要匯入的題目陣列
 * @param targetBank 目標題庫
 * @param options overwriteDuplicates: 若為 true，以匯入資料覆蓋同 ID 的現有題目
 */
export function importQuestions(
  questions: Question[],
  targetBank: QuestionBank | string,
  options?: ImportOptions
): {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
} {
  return importQuestionsByPrefix(questions, targetBank, options);
}

/**
 * 匯出題庫
 * @param bank 題庫類型
 * @returns JSON字符串
 */
export function exportQuestions(bank: QuestionBank | string): string {
  const { getQuestions } = useQuestionStore.getState();
  const questions = getQuestions(bank as QuestionBank);

  return JSON.stringify(questions, null, 2);
}

/**
 * 從文件讀取JSON
 */
export function readJsonFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        resolve(data);
      } catch (error) {
        reject(new Error('無法解析JSON文件'));
      }
    };
    reader.onerror = () => reject(new Error('讀取文件失敗'));
    reader.readAsText(file);
  });
}

