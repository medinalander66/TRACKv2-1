const AllowedDomain = require('../models').AllowedDomain;

// List all domains
exports.listDomains = async (req, res) => {
  try {
    const domains = await AllowedDomain.findAll({ order: [['created_at', 'DESC']] });
    res.json({ ok: true, domains });
  } catch (error) {
    console.error('List domains error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

// Add a new domain
exports.addDomain = async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || !domain.trim()) {
      return res.status(400).json({ ok: false, message: 'Domain is required.' });
    }
    const normalized = domain.trim().toLowerCase().replace(/^@/, '');
    const existing = await AllowedDomain.findOne({ where: { domain: normalized } });
    if (existing) {
      return res.status(409).json({ ok: false, message: 'Domain already exists.' });
    }
    const newDomain = await AllowedDomain.create({ domain: normalized });
    res.status(201).json({ ok: true, domain: newDomain });
  } catch (error) {
    console.error('Add domain error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

// Toggle active/inactive
exports.toggleDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const domain = await AllowedDomain.findByPk(id);
    if (!domain) return res.status(404).json({ ok: false, message: 'Domain not found.' });
    domain.is_active = !domain.is_active;
    await domain.save();
    res.json({ ok: true, domain });
  } catch (error) {
    console.error('Toggle domain error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

// Delete domain
exports.deleteDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const domain = await AllowedDomain.findByPk(id);
    if (!domain) return res.status(404).json({ ok: false, message: 'Domain not found.' });
    await domain.destroy();
    res.json({ ok: true, message: 'Domain removed.' });
  } catch (error) {
    console.error('Delete domain error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

// ─── Update Domain ─────────────────────────────────────
exports.updateDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const { domain } = req.body;
    if (!domain || !domain.trim()) {
      return res.status(400).json({ ok: false, message: 'Domain is required.' });
    }
    const domainRecord = await AllowedDomain.findByPk(id);
    if (!domainRecord) {
      return res.status(404).json({ ok: false, message: 'Domain not found.' });
    }
    // Check for duplicate (exclude self)
    const existing = await AllowedDomain.findOne({
      where: { domain: domain.trim(), id: { [Op.ne]: id } }
    });
    if (existing) {
      return res.status(409).json({ ok: false, message: 'Domain already exists.' });
    }
    domainRecord.domain = domain.trim();
    await domainRecord.save();
    res.json({ ok: true, domain: domainRecord });
  } catch (error) {
    console.error('Update domain error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};