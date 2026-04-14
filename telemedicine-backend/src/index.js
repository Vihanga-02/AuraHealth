require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ensureScheduleTable } = require('./models/scheduleModel');
const schedulesRouter = require('./routes/schedules');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/schedules', schedulesRouter);

app.get('/', (req, res) => {
  res.send('Telemedicine Backend Running');
});

const PORT = process.env.PORT || 5000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const startServer = async () => {
  const maxAttempts = Number(process.env.DB_INIT_MAX_RETRIES || 15);
  const retryDelayMs = Number(process.env.DB_INIT_RETRY_DELAY_MS || 2000);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await ensureScheduleTable();
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error('Failed to initialize server:', error);
        process.exit(1);
      }

      console.warn(`DB not ready (attempt ${attempt}/${maxAttempts}). Retrying in ${retryDelayMs}ms...`);
      await wait(retryDelayMs);
    }
  }
};

startServer();