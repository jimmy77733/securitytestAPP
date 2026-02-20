/**
 * 題組格式修正：合併同一檔案內重複的 description / questionGroups / questions
 * 使用方式：
 *   node scripts/fix-question-group-duplicate-keys.mjs <JSON 檔案路徑> [第二段 description 內容]
 *
 * 範例：
 *   node scripts/fix-question-group-duplicate-keys.mjs src/data/banks/q_intermediate_108-1.json "108年度中級資訊安全工程師能力鑑定試題 - 科目1:資訊安全規劃實務"
 *
 * 若省略第二參數，腳本會使用預設（上述 108 科目1）僅對 q_intermediate_108-1.json 有效。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const fileArg = process.argv[2];
const secondDescriptionArg = process.argv[3];

if (!fileArg) {
  console.error('用法: node scripts/fix-question-group-duplicate-keys.mjs <JSON 檔案路徑> [第二段 description 內容]');
  console.error('範例: node scripts/fix-question-group-duplicate-keys.mjs src/data/banks/q_intermediate_108-1.json "108年度中級資訊安全工程師能力鑑定試題 - 科目1:資訊安全規劃實務"');
  process.exit(1);
}

const filePath = path.isAbsolute(fileArg) ? fileArg : path.join(projectRoot, fileArg);
const secondDescription = secondDescriptionArg || '108年度中級資訊安全工程師能力鑑定試題 - 科目1:資訊安全規劃實務';

if (!fs.existsSync(filePath)) {
  console.error('找不到檔案:', filePath);
  process.exit(1);
}

const raw = fs.readFileSync(filePath, 'utf8');
const boundary = '\n    "description": "' + secondDescription + '"';
const idx = raw.indexOf(boundary);
if (idx === -1) {
  console.error('找不到第二段 description 邊界，請確認第二參數與檔案內容一致。');
  process.exit(1);
}

const part1Str = raw.slice(0, idx).replace(/,\s*$/, '') + '\n  }';
const part2Str = '{\n' + raw.slice(idx + 1);

let part1, part2;
try {
  part1 = JSON.parse(part1Str);
  part2 = JSON.parse(part2Str);
} catch (e) {
  console.error('JSON 解析失敗:', e.message);
  process.exit(1);
}

const merged = {
  description: (part1.description || '') + '；' + (part2.description || ''),
  questionGroups: [...(part1.questionGroups || []), ...(part2.questionGroups || [])],
  questions: [...(part1.questions || []), ...(part2.questions || [])],
};

fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
console.log('已合併:', filePath);
console.log('  description、questionGroups (' + merged.questionGroups.length + ')、questions (' + merged.questions.length + ')');
