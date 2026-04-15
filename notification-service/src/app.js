import express from 'express';
import cors from 'cors';
import notificationRoutes from './routes/notificationRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
// Note: Mounting both / and /api if needed for compatibility
app.use('/', notificationRoutes);

// Error Handler (Always last)
app.use(errorHandler);

export default app;
