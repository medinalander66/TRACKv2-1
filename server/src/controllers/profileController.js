const { v4: uuidv4 } = require('uuid');
const { ProfileChangeRequest, UserProfile } = require('../models');

const VALID_CHANGE_KEYS = [
  'department_change',
  'office_change',
  'role_update',
  'position_update',
];

exports.submitChangeRequest = async (req, res) => {
  try {
    const {
      changes,
      department_id,
      office_id,
      role_id,
      position_id,
      details,
    } = req.body;

    if (!Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({ ok: false, message: 'Please select at least one change type.' });
    }
    const validChanges = changes.filter((c) => VALID_CHANGE_KEYS.includes(c));
    if (validChanges.length === 0) {
      return res.status(400).json({ ok: false, message: 'Invalid change type(s) submitted.' });
    }
    if (!details || !details.trim()) {
      return res.status(400).json({ ok: false, message: 'Please provide details for your request.' });
    }

    if (validChanges.includes('department_change') && !department_id) {
      return res.status(400).json({ ok: false, message: 'department_id is required for a department change request.' });
    }
    if (validChanges.includes('office_change') && !office_id) {
      return res.status(400).json({ ok: false, message: 'office_id is required for an office change request.' });
    }
    if (validChanges.includes('role_update') && !role_id) {
      return res.status(400).json({ ok: false, message: 'role_id is required for a role update request.' });
    }
    if (validChanges.includes('position_update') && !position_id) {
      return res.status(400).json({ ok: false, message: 'position_id is required for a position update request.' });
    }

    // Prevent spamming duplicate pending requests
    const existingPending = await ProfileChangeRequest.findOne({
      where: { user_id: req.userId, status: 'pending' }
    });
    if (existingPending) {
      return res.status(409).json({ ok: false, message: 'You already have a pending profile change request. Please wait for it to be reviewed.' });
    }

    const request = await ProfileChangeRequest.create({
      id: uuidv4(),
      user_id: req.userId,
      changes: validChanges,
      requested_department_id: validChanges.includes('department_change') ? department_id : null,
      requested_office_id: validChanges.includes('office_change') ? office_id : null,
      requested_role_id: validChanges.includes('role_update') ? role_id : null,
      requested_position_id: validChanges.includes('position_update') ? position_id : null,
      details: details.trim(),
      status: 'pending',
    });

    res.status(201).json({ ok: true, message: 'Request submitted successfully!', request: { id: request.id } });
  } catch (error) {
    console.error('Submit change request error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};