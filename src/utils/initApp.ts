import { initSampleQuestions } from './questionLoader';

/**
 * 初始化應用程式
 * 載入題庫
 */
export function initApp(): void {
  // 嘗試載入實際題庫
  try {
    // 動態載入題庫（如果存在）
    import('../data/questionBanks')
      .then((module) => {
        if (module.loadAllQuestionBanks) {
          module.loadAllQuestionBanks();
          console.log('已載入題庫');
        }
      })
      .catch(() => {
        // 如果題庫文件不存在，載入示例題目
        if (import.meta.env.DEV) {
          initSampleQuestions();
          console.log('已載入示例題目（題庫文件未找到）');
        }
      });
  } catch (error) {
    // 如果載入失敗，使用示例題目
    if (import.meta.env.DEV) {
      initSampleQuestions();
      console.log('已載入示例題目（載入題庫時發生錯誤）');
    }
  }
}

