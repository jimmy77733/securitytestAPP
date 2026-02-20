/**
 * 修正 q_intermediate_108-1.json 的 Duplicate object key：
 * 檔案內有兩組 description / questionGroups / questions，合併為單一物件。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '../src/data/banks/q_intermediate_108-1.json');

const raw = fs.readFileSync(filePath, 'utf8');

const boundary = '\n    "description": "108年度中級資訊安全工程師能力鑑定試題 - 科目1:資訊安全規劃實務"';
const idx = raw.indexOf(boundary);
if (idx === -1) {
  console.error('Boundary not found');
  process.exit(1);
}

// 第一段結尾是 "    ]," 需去掉逗號再加 "  }" 才為合法 JSON
const part1Str = raw.slice(0, idx).replace(/,\s*$/, '') + '\n  }';
const part2Str = '{\n' + raw.slice(idx + 1);

const part1 = JSON.parse(part1Str);
const part2 = JSON.parse(part2Str);

const merged = {
  description: part1.description + '；' + part2.description,
  questionGroups: [...(part1.questionGroups || []), ...(part2.questionGroups || [])],
  questions: [...(part1.questions || []), ...(part2.questions || [])],
};

fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
console.log('Merged: description, questionGroups (' + merged.questionGroups.length + '), questions (' + merged.questions.length + ')');
