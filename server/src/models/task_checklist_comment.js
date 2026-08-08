const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskChecklistComment = sequelize.define('task_checklist_comments', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  checklist_item_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  comment_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'task_checklist_comments'
});

module.exports = TaskChecklistComment;