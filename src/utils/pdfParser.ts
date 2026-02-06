/**
 * PDF 解析工具
 * 注意：這是一個基礎框架，實際的PDF解析需要根據PDF格式進行調整
 * 建議使用 pdf-parse 或 pdfjs-dist 等庫來解析PDF內容
 */

export interface ParsedQuestion {
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
 * 解析PDF文件並提取題目
 * 這是一個示例函數，實際實現需要根據PDF格式進行調整
 */
export async function parsePDF(file: File): Promise<ParsedQuestion[]> {
  // TODO: 實現PDF解析邏輯
  // 可以使用 pdf-parse 或 pdfjs-dist 庫
  // 需要根據實際PDF格式提取：
  // 1. 題目文字
  // 2. 選項
  // 3. 正確答案
  // 4. 解析說明
  // 5. 年份和分類信息
  
  console.warn('PDF解析功能尚未實現，請使用題庫匯入工具');
  return [];
}

/**
 * 從JSON格式匯入題目
 */
export function importQuestionsFromJSON(jsonData: any): ParsedQuestion[] {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    
    if (!Array.isArray(data)) {
      throw new Error('題目資料必須是陣列格式');
    }

    return data.map((item, index) => ({
      id: item.id || `q_${Date.now()}_${index}`,
      questionBank: item.questionBank || 'primary',
      type: item.type || 'single',
      question: item.question || '',
      options: item.options || [],
      correctAnswers: item.correctAnswers || [],
      explanation: item.explanation,
      year: item.year,
      category: item.category,
    }));
  } catch (error) {
    console.error('匯入題目失敗:', error);
    throw error;
  }
}

/**
 * 生成題目ID
 */
export function generateQuestionId(prefix: string = 'q'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

