require('dotenv').config();
const express = require('express');
const cors = require('cors');
const doctorRoutes = require('./src/routes/doctorRoutes');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'doctor-service', timestamp: new Date().toISOString() });
});

app.use('/doctors', doctorRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`✅ Doctor service running on port ${PORT}`));