const { v4: uuidv4 } = require('uuid');
const { VenueConflictLog } = require('../models');

exports.logVenueConflictAttempt = async ({ venueId, start, end, blockedByEventId, userId }) => {
  try {
    await VenueConflictLog.create({
      id: uuidv4(),
      venue_id: venueId,
      requested_start: start,
      requested_end: end,
      blocked_by_event_id: blockedByEventId || null,
      attempted_by_user_id: userId || null,
    });
  } catch (err) {
    console.error('Failed to log venue conflict attempt:', err);
  }
};