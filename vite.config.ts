import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-upload-dev-middleware',
      configureServer(server) {
        server.middlewares.use('/api/upload', async (req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          if (req.method === 'POST') {
            try {
              const chunks: Buffer[] = [];
              for await (const chunk of req) {
                chunks.push(chunk);
              }
              const bodyStr = Buffer.concat(chunks).toString('utf-8');
              const { image, filename = 'memory.jpg' } = JSON.parse(bodyStr);

              const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              let blob: Blob;
              let mimeType = 'image/jpeg';
              if (matches && matches.length === 3) {
                mimeType = matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                blob = new Blob([buffer], { type: mimeType });
              } else {
                const buffer = Buffer.from(image, 'base64');
                blob = new Blob([buffer], { type: 'image/jpeg' });
              }

              const f = new FormData();
              f.append('reqtype', 'fileupload');
              f.append('fileToUpload', blob, filename);

              const catboxRes = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST',
                body: f,
              });

              const url = (await catboxRes.text()).trim();
              res.setHeader('Content-Type', 'application/json');
              if (url.startsWith('http')) {
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, url }));
              } else {
                res.statusCode = 502;
                res.end(JSON.stringify({ error: url }));
              }
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Dev upload error' }));
            }
          } else {
            res.statusCode = 405;
            res.end();
          }
        });
      },
    },
  ],
  server: {
    host: true,
    port: 5173,
  },
})

