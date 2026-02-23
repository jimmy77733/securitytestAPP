/**
 * 將 dist 與 public 複製到 dist-portable，讓該資料夾成為可獨立執行的發佈包。
 * 使用方式：node scripts/copy-portable-assets.cjs
 * 請先執行 npm run build 與 npm run pack（或至少 pkg 已產生 dist-portable/*.exe）。
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dest = path.join(root, 'dist-portable');

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

const distSrc = path.join(root, 'dist');
const publicSrc = path.join(root, 'public');
const distDest = path.join(dest, 'dist');
const publicDest = path.join(dest, 'public');

function copyDir(src, destPath) {
  if (!fs.existsSync(src)) {
    console.warn('Skip (not found):', src);
    return;
  }
  fs.mkdirSync(destPath, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(destPath, name);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

copyDir(distSrc, distDest);
copyDir(publicSrc, publicDest);
console.log('Copied dist and public to dist-portable/');
