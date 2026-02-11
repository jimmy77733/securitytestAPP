import { readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const imagesDir = join(__dirname, '../public/question-images');
const manifestPath = join(__dirname, '../public/question-images/manifest.json');

try {
  // 讀取圖片目錄中的所有檔案
  const files = readdirSync(imagesDir, { withFileTypes: true });
  
  // 過濾出 .png, .jpg, .jpeg 檔案，並提取題目 ID（檔名去掉副檔名）
  const imageIds = files
    .filter(file => {
      if (!file.isFile()) return false;
      const ext = file.name.toLowerCase().split('.').pop();
      return ['png', 'jpg', 'jpeg'].includes(ext);
    })
    .map(file => {
      // 檔名去掉副檔名 = 題目 ID
      return file.name.replace(/\.(png|jpg|jpeg)$/i, '');
    })
    .sort(); // 排序以便閱讀

  // 寫入 manifest.json
  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    imageIds: imageIds,
    count: imageIds.length
  };

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  
  console.log(`✅ 成功生成圖片清單：`);
  console.log(`   位置: ${manifestPath}`);
  console.log(`   圖片數量: ${imageIds.length}`);
  if (imageIds.length > 0) {
    console.log(`   範例 ID: ${imageIds.slice(0, 3).join(', ')}${imageIds.length > 3 ? '...' : ''}`);
  }
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`❌ 錯誤：找不到目錄 ${imagesDir}`);
    console.error(`   請先創建 public/question-images/ 目錄`);
  } else {
    console.error(`❌ 生成 manifest 失敗:`, error.message);
  }
  process.exit(1);
}
