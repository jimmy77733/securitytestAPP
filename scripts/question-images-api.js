import { writeFileSync, mkdirSync, existsSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MAX_FILES = 15;
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

/**
 * 取得題目圖片輸出目錄（可傳入專案根目錄，預設為 scripts 的上一層）
 */
export function getOutDir(projectRoot = join(__dirname, '..')) {
  return join(projectRoot, 'public', 'question-images');
}

/**
 * 取得專案根目錄（以 scripts 為基準）
 */
export function getProjectRoot() {
  return join(__dirname, '..');
}

/**
 * POST /api/check-question-images
 * Body: { filenames: string[] }
 * Returns: { existing: Array<{ name: string, mtime: string }> }
 */
export function handleCheckQuestionImages(body, outDir, res) {
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
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ existing }));
}

/**
 * POST /api/save-question-images
 * Body: { files: Array<{ name, data }>, overwriteNames?: string[] }
 * 若檔名已存在且不在 overwriteNames 內則略過；在 overwriteNames 內則覆蓋。
 */
export function handleSaveQuestionImages(payload, outDir, projectRoot, res) {
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

/**
 * GET /api/get-image-manifest
 * 回傳目前 manifest 的 generatedAt 與 count（不執行腳本）
 */
export function handleGetImageManifest(outDir, res) {
  const manifestPath = join(outDir, 'manifest.json');
  res.setHeader('Content-Type', 'application/json');
  if (!existsSync(manifestPath)) {
    res.statusCode = 200;
    res.end(JSON.stringify({ generatedAt: null, count: 0 }));
    return;
  }
  try {
    const raw = readFileSync(manifestPath, 'utf8');
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

/**
 * POST /api/generate-image-manifest
 * 執行 generate-image-manifest 腳本後回傳新 manifest 的 generatedAt 與 count
 */
export function handleGenerateImageManifest(outDir, projectRoot, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    execSync('node scripts/generate-question-image-manifest.js', {
      cwd: projectRoot,
      stdio: 'pipe',
    });
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: String(err?.message || err) }));
    return;
  }
  const manifestPath = join(outDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, generatedAt: null, count: 0 }));
    return;
  }
  try {
    const raw = readFileSync(manifestPath, 'utf8');
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
