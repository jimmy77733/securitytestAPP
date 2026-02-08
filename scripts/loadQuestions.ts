import * as fs from 'fs';
import * as path from 'path';
import type { Question } from '../src/types';

/**
 * 從題目 id 取得前贅詞（檔案名）
 * 例：q_primary_108-2_1 → q_primary_108-2
 */
function getPrefix(id: string): string {
  return id.replace(/_(\d+)$/, '');
}

/**
 * 載入並驗證 JSON 題目
 */
function loadQuestionsFromJSON(filePath: string): Question[] {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const questions = JSON.parse(data) as Question[];

    return (Array.isArray(questions) ? questions : [questions]).map((q, index) => {
      if (!q.id) {
        q.id = `q_${Date.now()}_${index}`;
      }

      q.options = (q.options || []).map((opt: { id?: string; text?: string }, optIdx: number) => ({
        id: opt.id || `opt_${optIdx + 1}`,
        text: opt.text || '',
      }));

      if (!q.correctAnswers || q.correctAnswers.length === 0) {
        console.warn(`題目 ${q.id} 缺少正確答案，使用第一個選項作為預設`);
        q.correctAnswers = [q.options[0]?.id || 'opt_1'];
      }

      q.correctAnswers = (q.correctAnswers || []).filter((answerId: string) =>
        q.options.some((opt: { id: string }) => opt.id === answerId)
      );
      if (q.correctAnswers.length === 0) {
        q.correctAnswers = [q.options[0]?.id || 'opt_1'];
      }

      return q;
    });
  } catch (error) {
    console.error(`載入文件 ${filePath} 失敗:`, error);
    return [];
  }
}

/**
 * 依前贅詞分組題目
 */
function groupByPrefix(questions: Question[]): Map<string, Question[]> {
  const map = new Map<string, Question[]>();
  for (const q of questions) {
    if (!q.id) continue;
    const prefix = getPrefix(q.id);
    if (!map.has(prefix)) map.set(prefix, []);
    map.get(prefix)!.push(q);
  }
  return map;
}

/**
 * 依題號排序（id 結尾數字）
 */
function sortByQuestionOrder(questions: Question[]): Question[] {
  return [...questions].sort((a, b) => {
    const numA = parseInt(a.id.match(/_(\d+)$/)?.[1] ?? '0', 10);
    const numB = parseInt(b.id.match(/_(\d+)$/)?.[1] ?? '0', 10);
    return numA - numB;
  });
}

function main() {
  const dataDir = path.join(process.cwd(), 'data');
  const banksInputDir = path.join(dataDir, 'banks');
  const primaryPath = path.join(dataDir, 'primary-questions.json');
  const intermediatePath = path.join(dataDir, 'intermediate-questions.json');

  const allQuestions: Question[] = [];

  if (fs.existsSync(primaryPath)) {
    const primary = loadQuestionsFromJSON(primaryPath);
    allQuestions.push(...primary);
    console.log(`初級題庫: ${primary.length} 題`);
  }

  if (fs.existsSync(intermediatePath)) {
    const intermediate = loadQuestionsFromJSON(intermediatePath);
    allQuestions.push(...intermediate);
    console.log(`中級題庫: ${intermediate.length} 題`);
  }

  if (fs.existsSync(banksInputDir)) {
    const files = fs.readdirSync(banksInputDir).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      const fullPath = path.join(banksInputDir, f);
      const list = loadQuestionsFromJSON(fullPath);
      allQuestions.push(...list);
      console.log(`data/banks/${f}: ${list.length} 題`);
    }
  }

  if (allQuestions.length === 0) {
    console.error('請先準備 data/primary-questions.json、data/intermediate-questions.json 或 data/banks/*.json');
    process.exit(1);
  }

  const byPrefix = groupByPrefix(allQuestions);
  const outDir = path.join(process.cwd(), 'src', 'data', 'banks');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const [prefix, questions] of byPrefix) {
    const sorted = sortByQuestionOrder(questions);
    const filePath = path.join(outDir, `${prefix}.json`);
    fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2), 'utf-8');
    console.log(`已寫入: src/data/banks/${prefix}.json (${sorted.length} 題)`);
  }

  console.log('\n完成。請由 src/data/questionBanks.ts 載入題庫。');
}

main();
