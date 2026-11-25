export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    const { image, filename = 'memory.jpg' } = body || {};
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let blob;
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
    if (url.startsWith('http')) {
      return res.status(200).json({ success: true, url });
    } else {
      return res.status(502).json({ error: url });
    }
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Upload error' });
  }
}
