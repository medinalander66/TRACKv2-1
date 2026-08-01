const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventAttendee = sequelize.define('event_attendees', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  event_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  response: {
    type: DataTypes.ENUM('accepted', 'declined', 'pending'),
    defaultValue: 'pending'
  },
  is_original: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notified_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'event_attendees'
});

module.exports = EventAttendee;