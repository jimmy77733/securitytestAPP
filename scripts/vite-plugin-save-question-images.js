import {
  getOutDir,
  getProjectRoot,
  handleCheckQuestionImages,
  handleSaveQuestionImages,
  handleGetImageManifest,
  handleGenerateImageManifest,
} from './question-images-api.js';

export function saveQuestionImagesPlugin() {
  return {
    name: 'save-question-images',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        const isImageApi =
          url === '/api/check-question-images' ||
          url === '/api/save-question-images' ||
          url === '/api/get-image-manifest' ||
          url === '/api/generate-image-manifest';
        if (!isImageApi) return next();

        const method = req.method;
        const outDir = getOutDir();
        const projectRoot = getProjectRoot();
        res.setHeader('Content-Type', 'application/json');

        try {
          if (method === 'GET' && url === '/api/get-image-manifest') {
            handleGetImageManifest(outDir, res);
            return;
          }
          if (method === 'POST' && url === '/api/generate-image-manifest') {
            handleGenerateImageManifest(outDir, projectRoot, res);
            return;
          }
          if (method === 'POST' && (url === '/api/check-question-images' || url === '/api/save-question-images')) {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const body = Buffer.concat(chunks).toString('utf8');
            const payload = JSON.parse(body || '{}');
            if (url === '/api/check-question-images') {
              handleCheckQuestionImages(payload, outDir, res);
              return;
            }
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
