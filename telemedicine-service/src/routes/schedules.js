const express = require('express');
const router = express.Router();
const {
	createSchedule,
	listSchedules,
	getSchedule,
	generateSession,
	completeSession,
	cancelSession,
	extendSession
} = require('../controllers/scheduleController');
const { generateToken } = require('../utils/agoraToken');

// ── Standalone token endpoint (no schedule needed) ────────────────────────
// Used for appointment-based calls where no telemedicine schedule exists in DB.
router.post('/token', (req, res) => {
	const { channelName, uid = 0, role = 'publisher' } = req.body || {};
	if (!channelName) {
		return res.status(400).json({ error: 'channelName is required' });
	}
	const token = generateToken(String(channelName), Number(uid), role, 3600);
	if (!token) {
		return res.status(503).json({ error: 'Agora App Certificate not configured on server' });
	}
	return res.json({ channelName, token, uid: Number(uid) });
});

// Create schedule
router.post('/', createSchedule);

// Get all schedules
router.get('/', listSchedules);

// Get a single schedule
router.get('/:id', getSchedule);

// Generate telemedicine session (channel + token)
router.post('/:id/session', generateSession);

// Mark telemedicine session completed
router.patch('/:id/complete', completeSession);

// Cancel schedule/session
router.patch('/:id/cancel', cancelSession);

// Extend schedule end time in minutes
router.patch('/:id/extend', extendSession);

module.exports = router;