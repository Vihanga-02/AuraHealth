import axios from 'axios';
import { Notification } from '../models/notificationModel.js';
import { config } from '../config/index.js';

export const sendSMS = async (number, message) => {
  const formattedNumber = number.startsWith('0') ? '94' + number.substring(1) : number;

  const logId = await Notification.create(formattedNumber, message);

  try {
    const response = await axios.post('https://app.text.lk/api/v3/sms/send', 
    {
      recipient: formattedNumber,
      sender_id: "TextLKDemo",
      type: "plain",
      message: message
    }, 
    {
      headers: {
        'Authorization': `Bearer ${config.smsApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (response.data.status == true || response.data.status === "success" || response.status === 200) {
      const smsId = response.data.data ? response.data.data.sms_id : 'NO_ID';

      await Notification.updateStatus(logId, 'SENT', smsId);
      
      return { success: true, message: "SMS Sent Successfully!" };
    } else {
      throw new Error(response.data.message || 'Failed to send SMS');
    }

  } catch (error) {
    const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    
    await Notification.updateStatus(logId, 'FAILED', null, errorMessage);
    
    return { success: false, error: errorMessage };
  }
};