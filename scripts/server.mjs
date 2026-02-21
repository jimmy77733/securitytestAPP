import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getOutDir,
  getProjectRoot,
  handleCheckQuestionImages,
  handleSaveQuestionImages,
  handleGetImageManifest,
  handleGenerateImageManifest,
} from './question-images-api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const outDir = getOutDir(projectRoot);

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

const server = http.createServer(async (req, res) => {
  const baseUrl = req.url?.split('?')[0] || '/';
  const method = req.method;
  const isGetManifest = method === 'GET' && baseUrl === '/api/get-image-manifest';
  const isGenerateManifest = method === 'POST' && baseUrl === '/api/generate-image-manifest';
  const isCheck = method === 'POST' && baseUrl === '/api/check-question-images';
  const isSave = method === 'POST' && baseUrl === '/api/save-question-images';

  if (isGetManifest) {
    res.setHeader('Content-Type', 'application/json');
    try {
      handleGetImageManifest(outDir, res);
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: String(err?.message || err) }));
    }
    return;
  }
  if (isGenerateManifest) {
    res.setHeader('Content-Type', 'application/json');
    try {
      handleGenerateImageManifest(outDir, projectRoot, res);
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
    res.setHeader('Content-Type', 'application/json');
    try {
      if (isCheck) {
        handleCheckQuestionImages(payload, outDir, res);
      } else {
        handleSaveQuestionImages(payload, outDir, projectRoot, res);
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
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Image import API: POST /api/check-question-images, /api/save-question-images');
});
