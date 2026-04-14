const express = require('express');
const { getMyAvailability, addMySlot, updateMySlot, deleteMySlot } = require('../controllers/availabilityController');

const router = express.Router();

router.get('/', getMyAvailability);
router.post('/', addMySlot);
router.put('/:slotId', updateMySlot);
router.delete('/:slotId', deleteMySlot);

module.exports = router;
