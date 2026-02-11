import { writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MAX_FILES = 15;
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

function getOutDir() {
  const projectRoot = join(__dirname, '..');
  return join(projectRoot, 'public', 'question-images');
}

function getProjectRoot() {
  return join(__dirname, '..');
}

/**
 * POST /api/check-question-images
 * Body: { filenames: string[] }
 * Returns: { existing: Array<{ name: string, mtime: string }> }
 */
function handleCheckQuestionImages(body, outDir, res) {
  const filenames = Array.isArray(body.filenames) ? body.filenames : [];
  const existing = [];
  for (const name of filenames) {
    const safe = (name || '').replace(/^.*[\\/]/, '').trim();
    if (!safe) continue;
    const outPath = join(outDir, safe);
    if (existsSync(outPath)) {
      try {
        const stat = statSync(outPath);
        existing.push({ name: safe, mtime: stat.mtime.toISOString() });
      } catch (_) {
        existing.push({ name: safe, mtime: null });
      }
    }
  }
  res.statusCode = 200;
  res.end(JSON.stringify({ existing }));
}

/**
 * POST /api/save-question-images
 * Body: { files: Array<{ name, data }>, overwriteNames?: string[] }
 * 若檔名已存在且不在 overwriteNames 內則略過；在 overwriteNames 內則覆蓋。
 */
function handleSaveQuestionImages(payload, outDir, projectRoot, res) {
  const files = Array.isArray(payload.files) ? payload.files : [];
  const overwriteNames = Array.isArray(payload.overwriteNames) ? payload.overwriteNames : [];

  if (files.length === 0) {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, error: '未提供檔案' }));
    return;
  }
  if (files.length > MAX_FILES) {
    res.statusCode = 400;
    res.end(JSON.stringify({ success: false, error: `最多僅能上傳 ${MAX_FILES} 張圖片` }));
    return;
  }

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
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

    const outPath = join(outDir, name);
    if (existsSync(outPath) && !overwriteNames.includes(name)) {
      try {
        const stat = statSync(outPath);
        skipped.push({ name, mtime: stat.mtime.toISOString() });
      } catch (_) {
        skipped.push({ name, mtime: null });
      }
      continue;
    }
    writeFileSync(outPath, buf);
    saved.push(name);
  }

  if (saved.length > 0) {
    try {
      execSync('node scripts/generate-question-image-manifest.js', {
        cwd: projectRoot,
        stdio: 'pipe',
      });
    } catch (_) {}
  }

  res.statusCode = 200;
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

export function saveQuestionImagesPlugin() {
  return {
    name: 'save-question-images',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        if (req.method !== 'POST' || (url !== '/api/save-question-images' && url !== '/api/check-question-images')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json');
        const outDir = getOutDir();
        const projectRoot = getProjectRoot();

        try {
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const body = Buffer.concat(chunks).toString('utf8');
          const payload = JSON.parse(body || '{}');

          if (url === '/api/check-question-images') {
            handleCheckQuestionImages(payload, outDir, res);
            return;
          }
          if (url === '/api/save-question-images') {
            handleSaveQuestionImages(payload, outDir, projectRoot, res);
            return;
          }
          next();
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: String(err?.message || err) }));
        }
      });
    },
  };
}
