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
 * 清理文本，移除多餘空白和換行
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

/**
 * 從文件名提取年份和分類
 */
function extractMetadata(filename: string): { year: string; category: string } {
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
 * 改進的PDF文本解析
 */
function parsePDFTextImproved(text: string, questionBank: 'primary' | 'intermediate', year: string, category: string): Question[] {
  const questions: Question[] = [];
  
  // 清理文本
  const cleanedText = cleanText(text);
  
  // 嘗試多種題目編號格式
  // 格式1: 數字. 或 數字) 開頭
  // 格式2: (數字) 開頭
  const questionPatterns = [
    /(?:^|\n)\s*(\d+)[\.\)]\s*(.+?)(?=\n\s*\d+[\.\)]|$)/gs,
    /(?:^|\n)\s*\((\d+)\)\s*(.+?)(?=\n\s*\(\d+\)|$)/gs,
  ];
  
  let allMatches: Array<{ number: string; content: string }> = [];
  
  for (const pattern of questionPatterns) {
    const matches = [...cleanedText.matchAll(pattern)];
    for (const match of matches) {
      allMatches.push({
        number: match[1],
        content: match[2] || match[3],
      });
    }
  }
  
  // 去重（保留第一個）
  const uniqueMatches = Array.from(
    new Map(allMatches.map(m => [m.number, m])).values()
  );
  
  let questionIndex = 0;
  
  for (const match of uniqueMatches) {
    const questionNumber = match.number;
    let questionContent = match.content.trim();
    
    if (!questionContent || questionContent.length < 10) continue;
    
    // 嘗試提取選項 - 支援多種格式
    const optionPatterns = [
      // 格式1: (A) 或 (B) 等
      /[\(（]?([A-D])[\)）\.、]\s*([^\(（]*?)(?=[\(（]?[A-D][\)）\.、]|答案|解析|說明|$)/g,
      // 格式2: A. 或 B. 等
      /([A-D])[\.、]\s*([^A-D]*?)(?=[A-D][\.、]|答案|解析|說明|$)/g,
    ];
    
    let options: Array<{ id: string; text: string }> = [];
    let optionTexts: string[] = [];
    
    for (const optPattern of optionPatterns) {
      const optMatches = [...questionContent.matchAll(optPattern)];
      if (optMatches.length >= 2) {
        for (const optMatch of optMatches) {
          const letter = optMatch[1];
          let optText = (optMatch[2] || optMatch[3] || '').trim();
          
          // 清理選項文字
          optText = optText.replace(/^[\.、\s]+/, '').trim();
          
          if (optText && optText.length > 1 && !optionTexts.includes(optText)) {
            options.push({
              id: `opt_${letter.toLowerCase()}`,
              text: optText,
            });
            optionTexts.push(optText);
          }
        }
        if (options.length >= 2) break;
      }
    }
    
    // 如果還是沒找到選項，嘗試更寬鬆的匹配
    if (options.length < 2) {
      const loosePattern = /([A-D])[\)）\.、\s]+([^\n]{10,200}?)(?=\n|$|[A-D][\)）\.、])/g;
      const looseMatches = [...questionContent.matchAll(loosePattern)];
      options = [];
      optionTexts = [];
      
      for (const optMatch of looseMatches) {
        const letter = optMatch[1];
        let optText = (optMatch[2] || '').trim();
        optText = optText.replace(/^[\.、\s]+/, '').trim();
        
        if (optText && optText.length > 5 && !optionTexts.includes(optText)) {
          options.push({
            id: `opt_${letter.toLowerCase()}`,
            text: optText.substring(0, 500), // 限制長度
          });
          optionTexts.push(optText);
        }
      }
    }
    
    if (options.length < 2) {
      console.warn(`題目 ${questionNumber} 選項不足 (${options.length})`);
      continue;
    }
    
    // 提取題目文字（移除選項部分）
    let questionText = questionContent;
    options.forEach(opt => {
      // 嘗試移除選項文字
      const optPattern = new RegExp(`[\(（]?${opt.id.replace('opt_', '').toUpperCase()}[\)）\.、]\\s*${opt.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
      questionText = questionText.replace(optPattern, '').trim();
    });
    
    // 清理題目文字
    questionText = questionText
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (questionText.length < 5) {
      console.warn(`題目 ${questionNumber} 題目文字過短`);
      continue;
    }
    
    // 提取答案
    const answerPatterns = [
      /(?:答案|正確答案|正確選項)[：:]\s*([A-D,，、\s]+)/i,
      /答案[：:]\s*([A-D])/i,
      /\s([A-D])\s*$/,
    ];
    
    let correctAnswers: string[] = [];
    for (const ansPattern of answerPatterns) {
      const ansMatch = questionContent.match(ansPattern);
      if (ansMatch) {
        const answerText = ansMatch[1].trim();
        const answerLetters = answerText.match(/[A-D]/gi) || [];
        correctAnswers = answerLetters.map(letter => `opt_${letter.toLowerCase()}`);
        if (correctAnswers.length > 0) break;
      }
    }
    
    // 如果沒找到答案，檢查選項ID是否在文本末尾
    if (correctAnswers.length === 0) {
      const lastPart = questionContent.slice(-50);
      const lastAnswerMatch = lastPart.match(/([A-D])\s*$/);
      if (lastAnswerMatch) {
        correctAnswers = [`opt_${lastAnswerMatch[1].toLowerCase()}`];
      }
    }
    
    // 如果還是沒找到，使用第一個選項作為預設（需要手動檢查）
    if (correctAnswers.length === 0) {
      console.warn(`題目 ${questionNumber} 未找到答案，使用第一個選項作為預設`);
      correctAnswers = [options[0].id];
    }
    
    // 驗證答案是否在選項中
    correctAnswers = correctAnswers.filter(answerId => 
      options.some(opt => opt.id === answerId)
    );
    
    if (correctAnswers.length === 0) {
      correctAnswers = [options[0].id];
    }
    
    // 判斷題型
    const isMultiple = 
      questionText.includes('複選') || 
      questionText.includes('多選') ||
      questionText.includes('哪些') ||
      (questionBank === 'intermediate' && correctAnswers.length > 1) ||
      (correctAnswers.length > 1);
    
    // 提取解析
    const explanationPatterns = [
      /(?:解析|說明|解答)[：:]\s*(.+?)(?=\n\s*\d+[\.\)]|$)/s,
      /解析[：:]\s*(.+?)(?=答案|$)/s,
    ];
    
    let explanation: string | undefined;
    for (const expPattern of explanationPatterns) {
      const expMatch = questionContent.match(expPattern);
      if (expMatch) {
        explanation = expMatch[1].trim().substring(0, 1000);
        break;
      }
    }
    
    const question: Question = {
      id: `q_${questionBank}_${year}_${questionNumber}_${questionIndex++}`,
      questionBank,
      type: isMultiple ? 'multiple' : 'single',
      question: questionText.substring(0, 2000), // 限制長度
      options: options.slice(0, 4), // 最多4個選項
      correctAnswers,
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
    
    const questions = parsePDFTextImproved(data.text, questionBank, year, category);
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
  
  console.log('開始解析PDF題庫（改進版）...\n');
  
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
  let warningCount = 0;
  
  [...primaryQuestions, ...intermediateQuestions].forEach((q) => {
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
      warningCount++;
    }
    // 驗證答案是否在選項中
    q.correctAnswers.forEach(ansId => {
      if (!q.options.some(opt => opt.id === ansId)) {
        console.error(`題目 ${q.id} 答案 ${ansId} 不在選項中`);
        errorCount++;
      }
    });
  });
  
  if (errorCount === 0 && warningCount === 0) {
    console.log('✓ 所有題目格式驗證通過！');
  } else {
    console.log(`⚠ 發現 ${errorCount} 個錯誤，${warningCount} 個警告，請檢查`);
  }
}

// 執行主函數
main().catch(console.error);

