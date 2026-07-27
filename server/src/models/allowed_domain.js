const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AllowedDomain = sequelize.define('allowed_domains', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  domain: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'allowed_domains',
  indexes: [
    { unique: true, fields: ['domain'] }
  ]
});

module.exports = AllowedDomain;