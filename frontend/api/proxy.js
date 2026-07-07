const RENDER_URL = 'https://ai-assistance-for-students-2.onrender.com';

export default async function handler(req, res) {
  const targetUrl = `${RENDER_URL}${req.url}`;
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers[key] = value;
    }
  }
  try {
    const body = req.method !== 'GET' && req.method !== 'HEAD' && req.body
      ? JSON.stringify(req.body)
      : undefined;
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body,
    });
    const data = await response.text();
    res.status(response.status);
    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }
    res.send(data);
  } catch (err) {
    res.status(502).json({ detail: `Proxy error: ${err.message}` });
  }
}
