import * as fs from 'fs';
import * as path from 'path';
import type { Question } from '../src/types';

/**
 * 手動匯入題目輔助工具
 */

interface ImportStats {
  total: number;
  valid: number;
  invalid: number;
  errors: string[];
  warnings: string[];
}

/**
 * 驗證單個題目
 */
function validateQuestion(q: any, index: number): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 檢查必要欄位
  if (!q.id) errors.push(`題目 ${index + 1}: 缺少ID`);
  if (!q.questionBank || !['primary', 'intermediate'].includes(q.questionBank)) {
    errors.push(`題目 ${index + 1}: questionBank 必須是 'primary' 或 'intermediate'`);
  }
  if (!q.type || !['single', 'multiple'].includes(q.type)) {
    errors.push(`題目 ${index + 1}: type 必須是 'single' 或 'multiple'`);
  }
  if (!q.question || q.question.length < 5) {
    errors.push(`題目 ${index + 1}: 題目文字過短或缺失`);
  }
  if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
    errors.push(`題目 ${index + 1}: 選項不足（至少需要2個）`);
  }
  if (!q.correctAnswers || !Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
    errors.push(`題目 ${index + 1}: 缺少正確答案`);
  }
  
  // 檢查選項格式
  if (q.options) {
    q.options.forEach((opt: any, optIdx: number) => {
      if (!opt.id || !opt.text) {
        errors.push(`題目 ${index + 1} 選項 ${optIdx + 1}: 缺少ID或文字`);
      }
      if (opt.id && !opt.id.startsWith('opt_')) {
        warnings.push(`題目 ${index + 1} 選項 ${optIdx + 1}: ID格式建議為 opt_a, opt_b 等`);
      }
    });
  }
  
  // 檢查答案是否在選項中
  if (q.correctAnswers && q.options) {
    q.correctAnswers.forEach((ansId: string) => {
      if (!q.options.some((opt: any) => opt.id === ansId)) {
        errors.push(`題目 ${index + 1}: 答案 ${ansId} 不在選項中`);
      }
    });
  }
  
  // 檢查多選題
  if (q.type === 'multiple' && q.correctAnswers && q.correctAnswers.length === 1) {
    warnings.push(`題目 ${index + 1}: 標記為多選但只有一個答案`);
  }
  
  // 檢查單選題
  if (q.type === 'single' && q.correctAnswers && q.correctAnswers.length > 1) {
    errors.push(`題目 ${index + 1}: 標記為單選但有多個答案`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 驗證題庫文件
 */
function validateQuestionBank(filePath: string): ImportStats {
  const stats: ImportStats = {
    total: 0,
    valid: 0,
    invalid: 0,
    errors: [],
    warnings: [],
  };
  
  if (!fs.existsSync(filePath)) {
    stats.errors.push(`文件不存在: ${filePath}`);
    return stats;
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const questions: any[] = JSON.parse(data);
    
    stats.total = questions.length;
    
    questions.forEach((q, index) => {
      const validation = validateQuestion(q, index);
      
      if (validation.valid) {
        stats.valid++;
      } else {
        stats.invalid++;
        stats.errors.push(...validation.errors);
      }
      
      stats.warnings.push(...validation.warnings);
    });
    
  } catch (error: any) {
    stats.errors.push(`解析JSON失敗: ${error.message}`);
  }
  
  return stats;
}

/**
 * 主函數
 */
function main() {
  const dataDir = path.join(process.cwd(), 'data');
  const primaryPath = path.join(dataDir, 'primary-questions.json');
  const intermediatePath = path.join(dataDir, 'intermediate-questions.json');
  
  console.log('開始驗證題庫文件...\n');
  
  console.log('=== 初級題庫 ===');
  const primaryStats = validateQuestionBank(primaryPath);
  console.log(`總數: ${primaryStats.total}`);
  console.log(`有效: ${primaryStats.valid}`);
  console.log(`無效: ${primaryStats.invalid}`);
  if (primaryStats.errors.length > 0) {
    console.log(`\n錯誤 (${primaryStats.errors.length}):`);
    primaryStats.errors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
    if (primaryStats.errors.length > 10) {
      console.log(`  ... 還有 ${primaryStats.errors.length - 10} 個錯誤`);
    }
  }
  if (primaryStats.warnings.length > 0) {
    console.log(`\n警告 (${primaryStats.warnings.length}):`);
    primaryStats.warnings.slice(0, 10).forEach(warn => console.log(`  - ${warn}`));
    if (primaryStats.warnings.length > 10) {
      console.log(`  ... 還有 ${primaryStats.warnings.length - 10} 個警告`);
    }
  }
  
  console.log('\n=== 中級題庫 ===');
  const intermediateStats = validateQuestionBank(intermediatePath);
  console.log(`總數: ${intermediateStats.total}`);
  console.log(`有效: ${intermediateStats.valid}`);
  console.log(`無效: ${intermediateStats.invalid}`);
  if (intermediateStats.errors.length > 0) {
    console.log(`\n錯誤 (${intermediateStats.errors.length}):`);
    intermediateStats.errors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
    if (intermediateStats.errors.length > 10) {
      console.log(`  ... 還有 ${intermediateStats.errors.length - 10} 個錯誤`);
    }
  }
  if (intermediateStats.warnings.length > 0) {
    console.log(`\n警告 (${intermediateStats.warnings.length}):`);
    intermediateStats.warnings.slice(0, 10).forEach(warn => console.log(`  - ${warn}`));
    if (intermediateStats.warnings.length > 10) {
      console.log(`  ... 還有 ${intermediateStats.warnings.length - 10} 個警告`);
    }
  }
  
  console.log('\n=== 總結 ===');
  const totalQuestions = primaryStats.total + intermediateStats.total;
  const totalValid = primaryStats.valid + intermediateStats.valid;
  const totalInvalid = primaryStats.invalid + intermediateStats.invalid;
  
  console.log(`總題數: ${totalQuestions}`);
  console.log(`有效題數: ${totalValid}`);
  console.log(`無效題數: ${totalInvalid}`);
  
  if (totalInvalid === 0 && totalQuestions > 0) {
    console.log('\n✓ 所有題目格式驗證通過！');
    console.log('可以執行 npm run load-questions 生成載入代碼');
  } else if (totalQuestions === 0) {
    console.log('\n⚠ 題庫文件為空，請先手動添加題目');
  } else {
    console.log('\n⚠ 請修正錯誤後重新驗證');
  }
}

main();

