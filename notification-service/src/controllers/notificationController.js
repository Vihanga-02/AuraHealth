import { sendSMS } from '../services/smsService.js';
import { getNotifications as fetchNotifications } from '../services/notificationReader.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * Send SMS Notification
 */
export const notify = async (req, res, next) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return errorResponse(res, 'Phone and message are required', 400);
    }

    const result = await sendSMS(phone, message);

    if (result.success) {
      return successResponse(res, 'Notification sent successfully', result);
    } else {
      return errorResponse(res, result.error || 'Failed to send notification', 500);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get Notification List
 */
export const getNotifications = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const result = await fetchNotifications(limit);

    if (result.success) {
      return successResponse(res, 'Notifications fetched successfully', {
        notifications: result.data,
        stats: result.stats
      });
    } else {
      return errorResponse(res, result.error || 'Failed to fetch notifications', 500);
    }
  } catch (error) {
    next(error);
  }
};
