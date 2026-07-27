const { Department, Office } = require('../models');

// ── Departments ──
exports.listDepartments = async (req, res) => {
  try {
    const rows = await Department.findAll({ order: [['name', 'ASC']] });
    res.json({ ok: true, items: rows });
  } catch (err) {
    console.error('List departments error:', err);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, message: 'Department name is required.' });
    }
    const existing = await Department.findOne({ where: { name: name.trim() } });
    if (existing) {
      return res.status(409).json({ ok: false, message: 'Department already exists.' });
    }
    const dept = await Department.create({ name: name.trim() });
    res.status(201).json({ ok: true, item: dept });
  } catch (err) {
    console.error('Create department error:', err);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

exports.toggleDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await Department.findByPk(id);
    if (!dept) return res.status(404).json({ ok: false, message: 'Department not found.' });
    dept.is_active = !dept.is_active;
    await dept.save();
    res.json({ ok: true, item: dept });
  } catch (err) {
    console.error('Toggle department error:', err);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

// ── Offices ──
exports.listOffices = async (req, res) => {
  try {
    const rows = await Office.findAll({ order: [['name', 'ASC']] });
    res.json({ ok: true, items: rows });
  } catch (err) {
    console.error('List offices error:', err);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

exports.createOffice = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, message: 'Office name is required.' });
    }
    const existing = await Office.findOne({ where: { name: name.trim() } });
    if (existing) {
      return res.status(409).json({ ok: false, message: 'Office already exists.' });
    }
    const office = await Office.create({ name: name.trim() });
    res.status(201).json({ ok: true, item: office });
  } catch (err) {
    console.error('Create office error:', err);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

exports.toggleOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const office = await Office.findByPk(id);
    if (!office) return res.status(404).json({ ok: false, message: 'Office not found.' });
    office.is_active = !office.is_active;
    await office.save();
    res.json({ ok: true, item: office });
  } catch (err) {
    console.error('Toggle office error:', err);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

// ─── Delete Department ─────────────────────────────────
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await Department.findByPk(id);
    if (!dept) {
      return res.status(404).json({ ok: false, message: 'Department not found.' });
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
    // Check for duplicate name (exclude self)
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

// ─── Delete Office ─────────────────────────────────────
exports.deleteOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const office = await Office.findByPk(id);
    if (!office) {
      return res.status(404).json({ ok: false, message: 'Office not found.' });
    }
    await office.destroy();
    res.json({ ok: true, message: 'Office deleted.' });
  } catch (error) {
    console.error('Delete office error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

// ─── Update Office ─────────────────────────────────────
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