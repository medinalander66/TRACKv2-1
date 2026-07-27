const { PositionAssignment, User, UserProfile, Position } = require('../models');
const { Op } = require('sequelize');

// ─── List all assignments with user and position info ──
exports.listAssignments = async (req, res) => {
  try {
    // 1. Get all active assignments
    const assignments = await PositionAssignment.findAll({
      where: { status: 'active' },
      order: [['created_at', 'DESC']]
    });

    // 2. Manually fetch related data for each assignment
    const enriched = await Promise.all(
      assignments.map(async (assignment) => {
        const plain = assignment.toJSON();

        // Fetch position
        if (plain.position_id) {
          const position = await Position.findByPk(plain.position_id, {
            attributes: ['id', 'name']
          });
          plain.Position = position ? position.toJSON() : null;
        } else {
          plain.Position = null;
        }

        // Fetch user with profile
        if (plain.user_id) {
          const user = await User.findByPk(plain.user_id, {
            attributes: ['id', 'email', 'username'],
            include: [
              {
                model: UserProfile,
                attributes: ['full_name']
              }
            ]
          });
          plain.User = user ? user.toJSON() : null;
        } else {
          plain.User = null;
        }

        return plain;
      })
    );

    res.json({ ok: true, assignments: enriched });
  } catch (error) {
    console.error('List assignments error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

// ─── Remove assignment (set inactive) ──────────────────
exports.removeAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await PositionAssignment.findByPk(id);
    if (!assignment) return res.status(404).json({ ok: false, message: 'Assignment not found.' });
    assignment.status = 'inactive';
    assignment.updated_at = new Date();
    await assignment.save();
    res.json({ ok: true, message: 'Assignment removed.' });
  } catch (error) {
    console.error('Remove assignment error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};