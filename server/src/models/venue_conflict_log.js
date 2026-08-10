const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VenueConflictLog = sequelize.define('venue_conflict_logs', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  venue_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  requested_start: {
    type: DataTypes.DATE,
    allowNull: false
  },
  requested_end: {
    type: DataTypes.DATE,
    allowNull: false
  },
  blocked_by_event_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  attempted_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'venue_conflict_logs'
});

module.exports = VenueConflictLog;