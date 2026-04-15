import express from 'express';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

// POST /notify - Send an SMS notification
router.post('/notify', notificationController.notify);

// GET /api/notifications - Get list of notifications and stats
router.get('/api/notifications', notificationController.getNotifications);

export default router;
