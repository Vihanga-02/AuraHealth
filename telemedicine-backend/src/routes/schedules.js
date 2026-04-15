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