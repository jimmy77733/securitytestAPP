/**
 * 依 category 在題目 id 尾號前插入科目前贅詞（初級＋中級）
 * 初級：資訊安全管理概論 → _m_；資訊安全技術概論 → _s_
 * 中級：資訊安全防護實務 → _p_；資訊安全規劃實務 → _o_
 * 例：q_primary_114-1_5 → q_primary_114-1_m_5；q_intermediate_108-1_1 → q_intermediate_108-1_p_1
 * 已含 _m_ / _s_ / _p_ / _o_ 尾段者不再處理。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const banksDir = path.join(__dirname, '../src/data/banks');

const CATEGORY_SUFFIX = {
  primary: {
    '資訊安全管理概論': 'm',
    '資訊安全技術概論': 's',
  },
  intermediate: {
    '資訊安全防護實務': 'p',
    '資訊安全規劃實務': 'o',
  },
};

function updateIdForCategory(id, questionBank, category) {
  if (!id || typeof id !== 'string') return id;
  if (/_[mspo]_\d+$/.test(id)) return id;
  const match = id.match(/^(.+)_(\d+)$/);
  if (!match) return id;
  const [, prefix, suffix] = match;
  const bankMap = CATEGORY_SUFFIX[questionBank];
  if (!bankMap) return id;
  const letter = bankMap[category];
  if (!letter) return id;
  return `${prefix}_${letter}_${suffix}`;
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Parse error:', filePath, e.message);
    return { updated: 0 };
  }
  const questions = Array.isArray(data) ? data : data.questions;
  if (!Array.isArray(questions)) {
    console.error('No questions array:', filePath);
    return { updated: 0 };
  }
  let updated = 0;
  for (const q of questions) {
    const bank = q.questionBank;
    const cat = q.category;
    const letterMap = CATEGORY_SUFFIX[bank];
    if (!letterMap || !letterMap[cat]) continue;
    const newId = updateIdForCategory(q.id, bank, cat);
    if (newId !== q.id) {
      q.id = newId;
      updated++;
    }
  }
  if (updated > 0) {
    const out = Array.isArray(data) ? questions : { ...data, questions };
    fs.writeFileSync(filePath, JSON.stringify(out, null, 2) + '\n', 'utf8');
  }
  return { updated };
}

const files = fs.readdirSync(banksDir).filter((f) => f.endsWith('.json'));
let total = 0;
for (const f of files) {
  const filePath = path.join(banksDir, f);
  const { updated } = processFile(filePath);
  if (updated > 0) {
    console.log(`${f}: ${updated} ids updated`);
    total += updated;
  }
}
console.log('Done. Total ids updated:', total);
