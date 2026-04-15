const Schedule = require('../models/scheduleModel');
const { generateToken } = require('../utils/agoraToken');

const toDatePart = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const toTimePart = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toTimeString().slice(0, 8);
  return String(value).slice(0, 8);
};

const buildScheduleDateTime = (schedule, timeKey) => {
  const datePart = toDatePart(schedule.date);
  const timePart = toTimePart(schedule[timeKey]);
  const timezoneOffset = process.env.SCHEDULE_TIMEZONE_OFFSET || '+05:30';

  if (!datePart || !timePart) {
    return null;
  }

  const parsed = new Date(`${datePart}T${timePart}${timezoneOffset}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const hasValidChannelName = (value) => {
  if (!value) return false;
  const text = String(value).trim();
  return text.length > 0 && !text.includes('NaN');
};

const createSchedule = async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const plusThirty = new Date(now.getTime() + 30 * 60 * 1000);
    const toTime = (date) => date.toTimeString().slice(0, 5);

    // Test mode defaults so users can create schedules quickly.
    const payload = {
      appointment_id: req.body?.appointment_id || `appt-${Date.now()}`,
      doctor_id: req.body?.doctor_id || 'doctor-test',
      patient_id: req.body?.patient_id || 'patient-test',
      title: req.body?.title || 'Test consultation',
      description: req.body?.description || '',
      date: req.body?.date || today,
      start_time: req.body?.start_time || toTime(now),
      end_time: req.body?.end_time || toTime(plusThirty)
    };

    const schedule = await Schedule.createSchedule(payload);
    res.status(201).json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
};

const listSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.getSchedules();
    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

const getSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.getScheduleById(id);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    return res.json(schedule);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch schedule' });
  }
};

const generateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid = 0, role = 'publisher' } = req.body || {};

    const schedule = await Schedule.getScheduleById(id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    if (schedule.session_status === 'canceled') {
      return res.status(403).json({ error: 'Session is canceled' });
    }

    if (schedule.session_status === 'completed') {
      return res.status(403).json({ error: 'Session is completed' });
    }

    const startTime = buildScheduleDateTime(schedule, 'start_time');
    const endTime = buildScheduleDateTime(schedule, 'end_time');
    const now = new Date();

    // Session is not joinable after its configured end time.
    if (endTime && now.getTime() > endTime.getTime()) {
      return res.status(403).json({ error: 'Session has ended' });
    }

    const existingChannel = hasValidChannelName(schedule.channel_name) ? schedule.channel_name : null;
    const baseChannelName = existingChannel || `schedule-${schedule.id}`;
    const channelSeed = startTime ? startTime.getTime() : Date.now();
    const channelName = existingChannel || `${baseChannelName}-${channelSeed}`;

    if (!existingChannel) {
      await Schedule.setChannelName(schedule.id, channelName);
    }

    const token = generateToken(channelName, Number(uid), role, 3600);
    const frontendBaseUrl = (process.env.FRONTEND_BASE_URL || process.env.CLIENT_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
    const shareLink = `${frontendBaseUrl}/telemedicine/join/${schedule.id}`;

    return res.json({
      schedule_id: schedule.id,
      appointment_id: schedule.appointment_id,
      channelName,
      token,
      uid: Number(uid),
      role,
      share_link: shareLink,
      starts_at: startTime ? startTime.toISOString() : null,
      ends_at: endTime ? endTime.toISOString() : null
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to generate telemedicine session' });
  }
};

const completeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Schedule.markSessionCompleted(id);

    if (!updated) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to mark session completed' });
  }
};

const cancelSession = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Schedule.updateSessionStatus(id, 'canceled');

    if (!updated) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to cancel session' });
  }
};

const extendSession = async (req, res) => {
  try {
    const { id } = req.params;
    const minutes = Number(req.body?.minutes || 5);

    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 120) {
      return res.status(400).json({ error: 'minutes must be between 1 and 120' });
    }

    const updated = await Schedule.extendScheduleEndTime(id, minutes);
    if (!updated) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const endsAt = buildScheduleDateTime(updated, 'end_time');
    return res.json({
      ...updated,
      ends_at: endsAt ? endsAt.toISOString() : null
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to extend session time' });
  }
};

module.exports = {
  createSchedule,
  listSchedules,
  getSchedule,
  generateSession,
  completeSession,
  cancelSession,
  extendSession
};