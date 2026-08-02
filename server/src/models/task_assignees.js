const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskAssignee = sequelize.define('task_assignees', {
  task_id: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    primaryKey: true
  },
  response: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined'),
    defaultValue: 'pending'
  },
  is_original: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'task_assignees'
});

module.exports = TaskAssignee;