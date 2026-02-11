import {
  getOutDir,
  getProjectRoot,
  handleCheckQuestionImages,
  handleSaveQuestionImages,
} from './question-images-api.js';

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
