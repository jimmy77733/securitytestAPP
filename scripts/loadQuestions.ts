import * as fs from 'fs';
import * as path from 'path';
import type { Question } from '../src/types';

/**
 * 載入JSON題庫文件並轉換為系統格式
 */
function loadQuestionsFromJSON(filePath: string): Question[] {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const questions = JSON.parse(data) as Question[];
    
    // 驗證並修正題目格式
    return questions.map((q, index) => {
      // 確保所有必要欄位存在
      if (!q.id) {
        q.id = `q_${Date.now()}_${index}`;
      }
      
      // 確保選項有正確的ID
      q.options = q.options.map((opt, optIdx) => ({
        id: opt.id || `opt_${optIdx + 1}`,
        text: opt.text || '',
      }));
      
      // 驗證正確答案
      if (!q.correctAnswers || q.correctAnswers.length === 0) {
        console.warn(`題目 ${q.id} 缺少正確答案，使用第一個選項作為預設`);
        q.correctAnswers = [q.options[0]?.id || 'opt_1'];
      }
      
      // 驗證正確答案是否在選項中
      q.correctAnswers = q.correctAnswers.filter(answerId => 
        q.options.some(opt => opt.id === answerId)
      );
      
      if (q.correctAnswers.length === 0) {
        console.warn(`題目 ${q.id} 正確答案不在選項中，使用第一個選項作為預設`);
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
 * 生成題庫載入代碼
 */
function generateLoaderCode(primaryQuestions: Question[], intermediateQuestions: Question[]): string {
  return `// 自動生成的題庫載入代碼
// 此文件由腳本自動生成，請勿手動修改

import { loadQuestionBank } from '@/utils/questionLoader';
import type { Question } from '@/types';

// 初級題庫
const primaryQuestions: Question[] = ${JSON.stringify(primaryQuestions, null, 2)};

// 中級題庫
const intermediateQuestions: Question[] = ${JSON.stringify(intermediateQuestions, null, 2)};

// 載入題庫
export function loadAllQuestionBanks() {
  loadQuestionBank('primary', primaryQuestions);
  loadQuestionBank('intermediate', intermediateQuestions);
  console.log('題庫載入完成:', {
    primary: primaryQuestions.length,
    intermediate: intermediateQuestions.length,
  });
}

// 導出題目數據（供開發使用）
export { primaryQuestions, intermediateQuestions };
`;
}

/**
 * 主函數
 */
function main() {
  const dataDir = path.join(process.cwd(), 'data');
  const primaryPath = path.join(dataDir, 'primary-questions.json');
  const intermediatePath = path.join(dataDir, 'intermediate-questions.json');
  
  if (!fs.existsSync(primaryPath) || !fs.existsSync(intermediatePath)) {
    console.error('請先執行 parsePdf.ts 腳本解析PDF文件');
    process.exit(1);
  }
  
  console.log('載入題庫文件...');
  const primaryQuestions = loadQuestionsFromJSON(primaryPath);
  const intermediateQuestions = loadQuestionsFromJSON(intermediatePath);
  
  console.log(`初級題庫: ${primaryQuestions.length} 題`);
  console.log(`中級題庫: ${intermediateQuestions.length} 題`);
  
  // 生成載入代碼
  const loaderCode = generateLoaderCode(primaryQuestions, intermediateQuestions);
  const loaderPath = path.join(process.cwd(), 'src', 'data', 'questionBanks.ts');
  
  // 確保目錄存在
  const loaderDir = path.dirname(loaderPath);
  if (!fs.existsSync(loaderDir)) {
    fs.mkdirSync(loaderDir, { recursive: true });
  }
  
  fs.writeFileSync(loaderPath, loaderCode, 'utf-8');
  console.log(`\n題庫載入代碼已生成: ${loaderPath}`);
  console.log('\n請在 src/utils/initApp.ts 中調用 loadAllQuestionBanks() 來載入題庫');
}

main();

