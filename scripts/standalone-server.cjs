/**
 * 獨立伺服器：可被 pkg 打包成單一執行檔。
 * 執行檔需與 dist/、public/question-images/ 放在同一資料夾（或專案根目錄）。
 * 若以 pkg 執行：專案根目錄 = 執行檔所在目錄。
 * 若以 node 執行：專案根目錄 = 本檔所在目錄的上一層。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isPkg = typeof process.pkg !== 'undefined';
const projectRoot = isPkg
  ? path.dirname(process.execPath)
  : path.join(__dirname, '..');

const distDir = path.join(projectRoot, 'dist');
const outDir = path.join(projectRoot, 'public', 'question-images');

const MAX_FILES = 15;
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function serveStatic(req, res, filePath) {
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    res.statusCode = 404;
    res.end('Not Found');
  });
  res.setHeader('Content-Type', mime);
  stream.pipe(res);
}

function handleCheckQuestionImages(body, res) {
  const filenames = Array.isArray(body.filenames) ? body.filenames : [];
  const existing = [];
  for (const name of filenames) {
    const safe = (name || '').replace(/^.*[\\/]/, '').trim();
    if (!safe) continue;
    const outPath = path.join(outDir, safe);
    if (fs.existsSync(outPath)) {
      try {
        const stat = fs.statSync(outPath);
        existing.push({ name: safe, mtime: stat.mtime.toISOString() });
      } catch (_) {
        existing.push({ name: safe, mtime: null });
      }
    }
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ existing }));
}

function generateImageManifestSync() {
  if (!fs.existsSync(outDir)) return;
  const files = fs.readdirSync(outDir, { withFileTypes: true });
  const imageIds = files
    .filter((file) => {
      if (!file.isFile()) return false;
      const ext = file.name.toLowerCase().split('.').pop();
      return ['png', 'jpg', 'jpeg'].includes(ext);
    })
    .map((file) => file.name.replace(/\.(png|jpg|jpeg)$/i, ''))
    .sort();
  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    imageIds,
    count: imageIds.length,
  };
  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
}

function handleSaveQuestionImages(payload, res) {
  const files = Array.isArray(payload.files) ? payload.files : [];
  const overwriteNames = Array.isArray(payload.overwriteNames) ? payload.overwriteNames : [];

  if (files.length === 0) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: '未提供檔案' }));
    return;
  }
  if (files.length > MAX_FILES) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: `最多僅能上傳 ${MAX_FILES} 張圖片` }));
    return;
  }

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const saved = [];
  const errors = [];
  const skipped = [];

  for (const f of files) {
    const name = (f.name || '').replace(/^.*[\\/]/, '').trim();
    if (!name || !/\.(png|jpg|jpeg)$/i.test(name)) {
      errors.push(`${name || '(無檔名)'}: 檔名須為 .png / .jpg / .jpeg`);
      continue;
    }
    if (!f.data || typeof f.data !== 'string') {
      errors.push(`${name}: 缺少資料`);
      continue;
    }
    let buf;
    try {
      buf = Buffer.from(f.data, 'base64');
    } catch {
      errors.push(`${name}: Base64 解碼失敗`);
      continue;
    }
    if (buf.length > MAX_SIZE_BYTES) {
      errors.push(`${name}: 超過 2MB 限制`);
      continue;
    }

    const outPath = path.join(outDir, name);
    if (fs.existsSync(outPath) && !overwriteNames.includes(name)) {
      try {
        const stat = fs.statSync(outPath);
        skipped.push({ name, mtime: stat.mtime.toISOString() });
      } catch (_) {
        skipped.push({ name, mtime: null });
      }
      continue;
    }
    fs.writeFileSync(outPath, buf);
    saved.push(name);
  }

  if (saved.length > 0) {
    try {
      generateImageManifestSync();
    } catch (_) {}
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      success: true,
      saved: saved.length,
      savedNames: saved,
      skipped: skipped.length ? skipped : undefined,
      errors: errors.length ? errors : undefined,
    })
  );
}

function handleGetImageManifest(res) {
  const manifestPath = path.join(outDir, 'manifest.json');
  res.setHeader('Content-Type', 'application/json');
  if (!fs.existsSync(manifestPath)) {
    res.statusCode = 200;
    res.end(JSON.stringify({ generatedAt: null, count: 0 }));
    return;
  }
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        generatedAt: manifest.generatedAt ?? null,
        count: Array.isArray(manifest.imageIds) ? manifest.imageIds.length : (manifest.count ?? 0),
      })
    );
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ generatedAt: null, count: 0, error: String(err?.message || err) }));
  }
}

function handleGenerateImageManifest(res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    generateImageManifestSync();
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: String(err?.message || err) }));
    return;
  }
  const manifestPath = path.join(outDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, generatedAt: null, count: 0 }));
    return;
  }
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        success: true,
        generatedAt: manifest.generatedAt ?? null,
        count: Array.isArray(manifest.imageIds) ? manifest.imageIds.length : (manifest.count ?? 0),
      })
    );
  } catch (err) {
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, generatedAt: null, count: 0 }));
  }
}

function openBrowser(url) {
  const { exec } = require('child_process');
  const cmd =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open';
  try {
    if (process.platform === 'win32') {
      exec('start "" "' + url + '"');
    } else {
      exec(cmd + ' ' + url);
    }
  } catch (_) {}
}

const server = http.createServer(async (req, res) => {
  const baseUrl = req.url?.split('?')[0] || '/';
  const method = req.method;
  const isGetManifest = method === 'GET' && baseUrl === '/api/get-image-manifest';
  const isGenerateManifest = method === 'POST' && baseUrl === '/api/generate-image-manifest';
  const isCheck = method === 'POST' && baseUrl === '/api/check-question-images';
  const isSave = method === 'POST' && baseUrl === '/api/save-question-images';

  if (isGetManifest) {
    try {
      handleGetImageManifest(res);
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: String(err?.message || err) }));
    }
    return;
  }
  if (isGenerateManifest) {
    try {
      handleGenerateImageManifest(res);
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: String(err?.message || err) }));
    }
    return;
  }
  if (isCheck || isSave) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString('utf8');
    let payload = {};
    try {
      payload = JSON.parse(body || '{}');
    } catch (_) {}
    try {
      if (isCheck) {
        handleCheckQuestionImages(payload, res);
      } else {
        handleSaveQuestionImages(payload, res);
      }
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: String(err?.message || err) }));
    }
    return;
  }

  let filePath = path.join(distDir, baseUrl === '/' ? 'index.html' : baseUrl);
  if (!path.resolve(filePath).startsWith(path.resolve(distDir))) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      filePath = path.join(distDir, 'index.html');
      fs.stat(filePath, (e2, s2) => {
        if (e2 || !s2?.isFile()) {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }
        serveStatic(req, res, filePath);
      });
      return;
    }
    serveStatic(req, res, filePath);
  });
});

const port = Number(process.env.PORT) || 4173;
const openOnStart = process.env.OPEN_BROWSER !== '0';

server.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`Server running at ${url}`);
  console.log('Image import API: POST /api/check-question-images, /api/save-question-images');
  if (openOnStart && isPkg) {
    openBrowser(url);
  }
});
