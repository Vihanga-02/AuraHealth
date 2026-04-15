import axios from 'axios';
import { Notification } from '../models/notificationModel.js';
import { config } from '../config/index.js';

export const sendSMS = async (number, message) => {
  const formattedNumber = number.startsWith('0') ? '94' + number.substring(1) : number;

  // ── Step 1: create log record (PENDING) ────────────────────────────────
  let logId = null;
  try {
    logId = await Notification.create(formattedNumber, message);
  } catch (dbErr) {
    console.error('[SMS] Failed to create notification log:', dbErr.message);
    // Continue – we still try to send the SMS even if DB logging fails
  }

  // ── Step 2: send the SMS ───────────────────────────────────────────────
  try {
    const response = await axios.post(
      'https://app.text.lk/api/v3/sms/send',
      {
        recipient: formattedNumber,
        sender_id: 'TextLKDemo',
        type: 'plain',
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${config.smsApiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000,
      }
    );

    const apiOk =
      response.data?.status === true ||
      response.data?.status === 'success' ||
      response.status === 200;

    if (apiOk) {
      const smsId = response.data?.data?.sms_id || 'NO_ID';

      // ── Step 3a: mark SENT ─────────────────────────────────────────────
      if (logId !== null) {
        try {
          await Notification.updateStatus(logId, 'SENT', smsId);
          console.log(`[SMS] Log #${logId} marked SENT (ref: ${smsId})`);
        } catch (dbErr) {
          console.error(`[SMS] Could not mark log #${logId} as SENT:`, dbErr.message);
        }
      }

      return { success: true, message: 'SMS Sent Successfully!' };
    }

    // Provider returned a non-success payload
    const providerError = response.data?.message || 'SMS provider returned failure';
    console.warn('[SMS] Provider returned failure:', providerError);

    if (logId !== null) {
      try {
        await Notification.updateStatus(logId, 'FAILED', null, providerError);
      } catch (dbErr) {
        console.error(`[SMS] Could not mark log #${logId} as FAILED:`, dbErr.message);
      }
    }

    return { success: false, error: providerError };
  } catch (networkErr) {
    // ── Step 3b: network / axios error ────────────────────────────────────
    const errMsg = networkErr.response
      ? JSON.stringify(networkErr.response.data)
      : networkErr.message;

    console.error('[SMS] Network/API error:', errMsg);

    if (logId !== null) {
      try {
        await Notification.updateStatus(logId, 'FAILED', null, errMsg);
      } catch (dbErr) {
        console.error(`[SMS] Could not mark log #${logId} as FAILED:`, dbErr.message);
      }
    }

    return { success: false, error: errMsg };
  }
};
