import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';

interface Question {
  id: string;
  questionBank: 'primary' | 'intermediate';
  type: 'single' | 'multiple';
  question: string;
  options: Array<{ id: string; text: string }>;
  correctAnswers: string[];
  explanation?: string;
  year?: string;
  category?: string;
}

/**
 * 從文件名提取年份和分類
 */
function extractMetadata(filename: string): { year: string; category: string } {
  // 初級題庫格式: 108-2資訊安全工程師-資訊安全技術概論.pdf
  // 中級題庫格式: 108年資訊安全工程師-資訊安全規劃實務.pdf
  
  const yearMatch = filename.match(/(\d{3,4})[年-]?(\d)?/);
  const categoryMatch = filename.match(/資訊安全(.+?)(?:\.pdf|$)/);
  
  let year = '';
  if (yearMatch) {
    const mainYear = yearMatch[1];
    const subYear = yearMatch[2] || '';
    year = subYear ? `${mainYear}-${subYear}` : mainYear;
  }
  
  const category = categoryMatch ? categoryMatch[1].trim() : '';
  
  return { year, category };
}

/**
 * 解析PDF文本內容並提取題目
 */
function parsePDFText(text: string, questionBank: 'primary' | 'intermediate', year: string, category: string): Question[] {
  const questions: Question[] = [];
  
  // 分割題目（通常題目以數字開頭，如 "1." 或 "(1)"）
  const questionPattern = /(?:^|\n)\s*(\d+)[\.\)]\s*(.+?)(?=\n\s*\d+[\.\)]|$)/gs;
  const matches = [...text.matchAll(questionPattern)];
  
  let questionIndex = 0;
  
  for (const match of matches) {
    const questionNumber = match[1];
    const questionContent = match[2].trim();
    
    if (!questionContent || questionContent.length < 10) continue;
    
    // 提取選項（通常是 (A), (B), (C), (D) 或 A., B., C., D.）
    const optionPattern = /[\(（]?([A-D])[\)）\.、]\s*(.+?)(?=[\(（]?[A-D][\)）\.、]|答案|解析|$)/g;
    const optionMatches = [...questionContent.matchAll(optionPattern)];
    
    if (optionMatches.length < 2) {
      // 如果沒有找到標準選項格式，嘗試其他格式
      console.warn(`題目 ${questionNumber} 無法解析選項格式`);
      continue;
    }
    
    const options: Array<{ id: string; text: string }> = [];
    optionMatches.forEach((optMatch, idx) => {
      const optionLetter = optMatch[1];
      const optionText = optMatch[2].trim();
      if (optionText) {
        options.push({
          id: `opt_${optionLetter.toLowerCase()}`,
          text: optionText,
        });
      }
    });
    
    if (options.length < 2) {
      console.warn(`題目 ${questionNumber} 選項不足`);
      continue;
    }
    
    // 提取題目文字（去除選項部分）
    let questionText = questionContent;
    optionMatches.forEach(optMatch => {
      questionText = questionText.replace(optMatch[0], '').trim();
    });
    
    // 提取答案（通常在 "答案：" 或 "正確答案：" 後面）
    const answerPattern = /(?:答案|正確答案)[：:]\s*([A-D,，、\s]+)/i;
    const answerMatch = questionContent.match(answerPattern);
    
    let correctAnswers: string[] = [];
    if (answerMatch) {
      const answerText = answerMatch[1].trim();
      // 處理多選題答案（可能包含多個字母）
      const answerLetters = answerText.match(/[A-D]/gi) || [];
      correctAnswers = answerLetters.map(letter => `opt_${letter.toLowerCase()}`);
    } else {
      // 如果沒有找到答案，標記為需要手動檢查
      console.warn(`題目 ${questionNumber} 未找到答案，請手動檢查`);
      // 暫時設為第一個選項（需要手動修正）
      correctAnswers = [options[0].id];
    }
    
    // 判斷題型（多選題通常答案多於一個）
    const isMultiple = correctAnswers.length > 1 || 
                      questionText.includes('複選') || 
                      questionText.includes('多選') ||
                      (questionBank === 'intermediate' && correctAnswers.length > 1);
    
    // 提取解析（通常在 "解析：" 或 "說明：" 後面）
    const explanationPattern = /(?:解析|說明)[：:]\s*(.+?)(?=\n\s*\d+[\.\)]|$)/s;
    const explanationMatch = questionContent.match(explanationPattern);
    const explanation = explanationMatch ? explanationMatch[1].trim() : undefined;
    
    const question: Question = {
      id: `q_${questionBank}_${year}_${questionNumber}_${questionIndex++}`,
      questionBank,
      type: isMultiple ? 'multiple' : 'single',
      question: questionText,
      options,
      correctAnswers: correctAnswers.length > 0 ? correctAnswers : [options[0].id], // 預設第一個選項
      explanation,
      year,
      category,
    };
    
    questions.push(question);
  }
  
  return questions;
}

/**
 * 處理單個PDF文件
 */
async function processPDFFile(filePath: string, questionBank: 'primary' | 'intermediate'): Promise<Question[]> {
  try {
    const filename = path.basename(filePath);
    console.log(`正在處理: ${filename}`);
    
    const { year, category } = extractMetadata(filename);
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    const questions = parsePDFText(data.text, questionBank, year, category);
    console.log(`  提取了 ${questions.length} 題`);
    
    return questions;
  } catch (error) {
    console.error(`處理文件 ${filePath} 時發生錯誤:`, error);
    return [];
  }
}

/**
 * 處理整個題庫目錄
 */
async function processQuestionBank(
  bankDir: string,
  questionBank: 'primary' | 'intermediate'
): Promise<Question[]> {
  const allQuestions: Question[] = [];
  
  if (!fs.existsSync(bankDir)) {
    console.error(`目錄不存在: ${bankDir}`);
    return [];
  }
  
  const files = fs.readdirSync(bankDir).filter(f => f.endsWith('.pdf'));
  console.log(`\n找到 ${files.length} 個PDF文件在 ${questionBank} 題庫\n`);
  
  for (const file of files) {
    const filePath = path.join(bankDir, file);
    const questions = await processPDFFile(filePath, questionBank);
    allQuestions.push(...questions);
  }
  
  return allQuestions;
}

/**
 * 主函數
 */
async function main() {
  const primaryDir = path.join(process.cwd(), '初級題庫');
  const intermediateDir = path.join(process.cwd(), '中級題庫');
  
  console.log('開始解析PDF題庫...\n');
  
  // 處理初級題庫
  const primaryQuestions = await processQuestionBank(primaryDir, 'primary');
  console.log(`\n初級題庫總共提取: ${primaryQuestions.length} 題`);
  
  // 處理中級題庫
  const intermediateQuestions = await processQuestionBank(intermediateDir, 'intermediate');
  console.log(`\n中級題庫總共提取: ${intermediateQuestions.length} 題`);
  
  // 保存為JSON文件
  const outputDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const primaryOutput = path.join(outputDir, 'primary-questions.json');
  const intermediateOutput = path.join(outputDir, 'intermediate-questions.json');
  
  fs.writeFileSync(primaryOutput, JSON.stringify(primaryQuestions, null, 2), 'utf-8');
  fs.writeFileSync(intermediateOutput, JSON.stringify(intermediateQuestions, null, 2), 'utf-8');
  
  console.log(`\n題目已保存到:`);
  console.log(`  - ${primaryOutput}`);
  console.log(`  - ${intermediateOutput}`);
  console.log(`\n總共提取: ${primaryQuestions.length + intermediateQuestions.length} 題`);
  
  // 驗證題目格式
  console.log('\n驗證題目格式...');
  let errorCount = 0;
  
  [...primaryQuestions, ...intermediateQuestions].forEach((q, idx) => {
    if (!q.question || q.question.length < 5) {
      console.error(`題目 ${q.id} 題目文字過短`);
      errorCount++;
    }
    if (!q.options || q.options.length < 2) {
      console.error(`題目 ${q.id} 選項不足`);
      errorCount++;
    }
    if (!q.correctAnswers || q.correctAnswers.length === 0) {
      console.error(`題目 ${q.id} 缺少正確答案`);
      errorCount++;
    }
    if (q.type === 'multiple' && q.correctAnswers.length === 1) {
      console.warn(`題目 ${q.id} 標記為多選但只有一個答案`);
    }
  });
  
  if (errorCount === 0) {
    console.log('✓ 所有題目格式驗證通過！');
  } else {
    console.log(`⚠ 發現 ${errorCount} 個格式問題，請檢查`);
  }
}

// 執行主函數
main().catch(console.error);

