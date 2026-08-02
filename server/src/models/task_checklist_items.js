const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskChecklistItem = sequelize.define('task_checklist_items', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  task_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  text: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  completed_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'task_checklist_items'
});

module.exports = TaskChecklistItem;