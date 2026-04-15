require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:5002';
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:5003';
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5004';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5005';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5006';
const TELEMEDICINE_SERVICE_URL = process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:5007';

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
/**
 * Forward a request to a target service with optional prefix rewrite.
 * - By default, strips the leading /api/ prefix (gateway convention).
 * - You can override by providing an explicit rewrite from gatewayPrefix -> servicePrefix.
 */
const forwardRequest =
  (targetUrl, { gatewayPrefix = '/api', servicePrefix = '' } = {}) =>
  async (req, res) => {
  try {
    const original = req.originalUrl;
    const rewrittenPath = original.startsWith(gatewayPrefix)
      ? `${servicePrefix}${original.slice(gatewayPrefix.length)}`
      : original.replace(/^\/api(\/|$)/, `${servicePrefix}$1`);
    const url = `${targetUrl}${rewrittenPath}`;

    // For multipart/form-data (file uploads), pipe the raw request stream so
    // multer on the upstream service can parse the boundary correctly.
    // express.json() does NOT consume multipart bodies, so req is still readable.
    const contentType = req.headers['content-type'] || '';
    const isMultipart = contentType.includes('multipart/form-data');

    const response = await axios({
      method: req.method,
      url: url,
      data: isMultipart ? req : req.body,
      headers: { 
        ...req.headers, 
        host: new URL(targetUrl).host,
        connection: 'keep-alive' 
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      responseType: 'arraybuffer',
      validateStatus: () => true 
    });
    
    // Copy safe headers and set status
    res.status(response.status);
    const responseContentType = response.headers['content-type'] || '';
    Object.entries(response.headers).forEach(([key, value]) => {
      if (!['transfer-encoding', 'connection', 'content-length'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    // Return JSON as object, everything else as raw buffer
    if (responseContentType.includes('application/json')) {
      try {
        res.json(JSON.parse(Buffer.from(response.data).toString('utf8')));
      } catch {
        res.send(response.data);
      }
    } else {
      res.send(Buffer.from(response.data));
    }
  } catch (error) {
    console.error('Proxy Error:', error.message);
    res.status(502).json({ message: 'Upstream service unavailable', details: error.message });
  }
};

// ── Proxy Routes ──────────────────────────────────────────────────────────────
// Auth + Doctors already mount their own /auth and /doctors prefixes.
app.use('/api/auth', forwardRequest(AUTH_SERVICE_URL, { gatewayPrefix: '/api' }));
app.use('/api/doctors', forwardRequest(DOCTOR_SERVICE_URL, { gatewayPrefix: '/api' }));

// Patient service mounts /patients and serves static /uploads.
app.use(
  '/api/patients',
  forwardRequest(PATIENT_SERVICE_URL, { gatewayPrefix: '/api/patients', servicePrefix: '/patients' })
);
app.use(
  '/api/uploads',
  forwardRequest(PATIENT_SERVICE_URL, { gatewayPrefix: '/api/uploads', servicePrefix: '/uploads' })
);

// Appointment service mounts /appointments.
app.use(
  '/api/appointments',
  forwardRequest(APPOINTMENT_SERVICE_URL, {
    gatewayPrefix: '/api/appointments',
    servicePrefix: '/appointments'
  })
);

// Payment service mounts /api/payments already.
app.use(
  '/api/payments',
  forwardRequest(PAYMENT_SERVICE_URL, { gatewayPrefix: '/api/payments', servicePrefix: '/api/payments' })
);

// Notification service mounts /notify and /api/notifications; we expose everything under /api/notifications.
app.use(
  '/api/notifications',
  forwardRequest(NOTIFICATION_SERVICE_URL, {
    gatewayPrefix: '/api/notifications',
    servicePrefix: '/api/notifications'
  })
);
// Keep compatibility for internal callers that still hit /api/notify.
app.use(
  '/api/notify',
  forwardRequest(NOTIFICATION_SERVICE_URL, { gatewayPrefix: '/api/notify', servicePrefix: '/notify' })
);

// Telemedicine service mounts /api/schedules; expose it under /api/telemedicine/schedules.
app.use(
  '/api/telemedicine',
  forwardRequest(TELEMEDICINE_SERVICE_URL, { gatewayPrefix: '/api/telemedicine', servicePrefix: '/api' })
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Gateway Route not found' }));

app.listen(PORT, () => console.log(`✅ API Gateway running on port ${PORT} with clean async proxy`));
