const { AccountCode } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Sequelize } = require('sequelize');

/**
 * Generate a unique account code
 * @param {Object} params
 * @param {string} params.department_id - UUID of department
 * @param {string} params.office_id - UUID of office
 * @param {string} params.role_id - UUID of role
 * @param {string} params.position_id - UUID of position
 * @param {boolean} params.is_admin - Whether this is an admin code
 * @param {string} params.source_type - 'admin_generated' or 'request_approved'
 * @param {string} params.account_code_request_id - UUID of the associated request (if any)
 */
exports.generateUniqueCode = async ({
  department_id,
  office_id,
  role_id,
  position_id,
  is_admin,
  source_type = 'admin_generated',           // default
  account_code_request_id = null             // default
}) => {
  // Get names for prefix
  const { Department, Office, Role, Position } = require('../models');

  let dept = null, office = null, role = null, pos = null;
  if (department_id) {
    dept = await Department.findByPk(department_id);
  }
  if (office_id) {
    office = await Office.findByPk(office_id);
  }
  if (role_id) {
    role = await Role.findByPk(role_id);
  }
  if (position_id) {
    pos = await Position.findByPk(position_id);
  }

  const makePrefix = (name) => {
    if (!name) return 'NON';
    const cleaned = name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'NON';
    if (parts.length === 1) return parts[0].substring(0, 3).toUpperCase();
    return parts.map(p => p[0]).join('').substring(0, 3).toUpperCase();
  };

  const deptPrefix = makePrefix(dept?.name);
  const officePrefix = makePrefix(office?.name);
  const rolePrefix = makePrefix(role?.name);
  const adminSuffix = is_admin ? '-ADMIN' : '';

  let created = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${deptPrefix}-${officePrefix}-${rolePrefix}-${rand}${adminSuffix}`;
    try {
      created = await AccountCode.create({
        id: uuidv4(),
        code,
        department_id: department_id || null,
        office_id: office_id || null,
        role_id: role_id || null,
        position_id: position_id || null,
        is_admin: !!is_admin,
        status: 'unused',
        source_type: source_type,                          // new
        account_code_request_id: account_code_request_id || null // new
      });
      break;
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) continue;
      throw err;
    }
  }

  if (!created) {
    throw new Error('Failed to generate unique code.');
  }

  return created;
};