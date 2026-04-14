require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5002';

// ── CORS & Body Parsing ───────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true });
app.use(limiter);

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// ── Manual Reverse Proxy ──────────────────────────────────────────────────────
const forwardRequest = (targetUrl) => async (req, res) => {
  try {
    // Rewrite path e.g. /api/auth/login?foo=1 -> /auth/login?foo=1
    const newUrlPath = req.originalUrl.replace(/^\/api\//, '/');
    const url = `${targetUrl}${newUrlPath}`;
    
    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: { 
        ...req.headers, 
        host: new URL(targetUrl).host,
        connection: 'keep-alive' 
      },
      validateStatus: () => true 
    });
    
    // Copy safe headers and set status
    res.status(response.status);
    Object.entries(response.headers).forEach(([key, value]) => {
      // Avoid forwarding encodings that cause chunking issues
      if (!['transfer-encoding', 'connection', 'content-length'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.send(response.data);
  } catch (error) {
    console.error('Proxy Error:', error.message);
    res.status(502).json({ message: 'Upstream service unavailable', details: error.message });
  }
};

// ── Proxy Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', forwardRequest(AUTH_SERVICE_URL));
app.use('/api/doctors', forwardRequest(DOCTOR_SERVICE_URL));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Gateway Route not found' }));

app.listen(PORT, () => console.log(`✅ API Gateway running on port ${PORT} with clean async proxy`));
