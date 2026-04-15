import { Notification } from '../models/notificationModel.js';

export const getNotifications = async (limit = 100) => {
  try {
    const notifications = await Notification.findAll(limit);
    const stats = await Notification.getStats();
    
    return { 
      success: true, 
      data: notifications,
      stats: stats
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: 'Database query failed' };
  }
};
