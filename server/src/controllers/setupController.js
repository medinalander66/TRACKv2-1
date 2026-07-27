const { Department, Office, UserProfile, Event } = require('../models');
const { Op } = require('sequelize');

// ─── Delete Department (with in-use check) ─────────────
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await Department.findByPk(id);
    if (!dept) {
      return res.status(404).json({ ok: false, message: 'Department not found.' });
    }

    // Check if any user profile uses this department
    const inUse = await UserProfile.findOne({ where: { department_id: id } });
    if (inUse) {
      return res.status(409).json({
        ok: false,
        message: 'Cannot delete department. It is currently assigned to one or more users.'
      });
    }

    await dept.destroy();
    res.json({ ok: true, message: 'Department deleted.' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

// ─── Update Department ─────────────────────────────────
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, message: 'Department name is required.' });
    }
    const dept = await Department.findByPk(id);
    if (!dept) {
      return res.status(404).json({ ok: false, message: 'Department not found.' });
    }
    const existing = await Department.findOne({
      where: { name: name.trim(), id: { [Op.ne]: id } }
    });
    if (existing) {
      return res.status(409).json({ ok: false, message: 'Department name already exists.' });
    }
    dept.name = name.trim();
    await dept.save();
    res.json({ ok: true, department: dept });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

// ─── Toggle Department (with in-use check) ─────────────
exports.toggleDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await Department.findByPk(id);
    if (!dept) return res.status(404).json({ ok: false, message: 'Department not found.' });

    // If trying to deactivate, check if in use
    if (dept.is_active) {
      const inUse = await UserProfile.findOne({ where: { department_id: id } });
      if (inUse) {
        return res.status(409).json({
          ok: false,
          message: 'Cannot deactivate department. It is currently assigned to one or more users.'
        });
      }
    }

    dept.is_active = !dept.is_active;
    await dept.save();
    res.json({ ok: true, item: dept });
  } catch (error) {
    console.error('Toggle department error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

// ─── Delete Office (with in-use check) ──────────────────
exports.deleteOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const office = await Office.findByPk(id);
    if (!office) {
      return res.status(404).json({ ok: false, message: 'Office not found.' });
    }

    const inUse = await UserProfile.findOne({ where: { office_id: id } });
    if (inUse) {
      return res.status(409).json({
        ok: false,
        message: 'Cannot delete office. It is currently assigned to one or more users.'
      });
    }

    await office.destroy();
    res.json({ ok: true, message: 'Office deleted.' });
  } catch (error) {
    console.error('Delete office error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

// ─── Update Office ──────────────────────────────────────
exports.updateOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, message: 'Office name is required.' });
    }
    const office = await Office.findByPk(id);
    if (!office) {
      return res.status(404).json({ ok: false, message: 'Office not found.' });
    }
    const existing = await Office.findOne({
      where: { name: name.trim(), id: { [Op.ne]: id } }
    });
    if (existing) {
      return res.status(409).json({ ok: false, message: 'Office name already exists.' });
    }
    office.name = name.trim();
    await office.save();
    res.json({ ok: true, office });
  } catch (error) {
    console.error('Update office error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

// ─── Toggle Office (with in-use check) ──────────────────
exports.toggleOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const office = await Office.findByPk(id);
    if (!office) return res.status(404).json({ ok: false, message: 'Office not found.' });

    if (office.is_active) {
      const inUse = await UserProfile.findOne({ where: { office_id: id } });
      if (inUse) {
        return res.status(409).json({
          ok: false,
          message: 'Cannot deactivate office. It is currently assigned to one or more users.'
        });
      }
    }

    office.is_active = !office.is_active;
    await office.save();
    res.json({ ok: true, item: office });
  } catch (error) {
    console.error('Toggle office error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};