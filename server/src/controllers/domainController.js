const { AllowedDomain, User } = require('../models');
const { Op } = require('sequelize');

// ─── Delete Domain (with in-use check) ─────────────────
exports.deleteDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const domain = await AllowedDomain.findByPk(id);
    if (!domain) {
      return res.status(404).json({ ok: false, message: 'Domain not found.' });
    }

    // Check if any user has this domain in their email
    const inUse = await User.findOne({
      where: { email: { [Op.like]: `%@${domain.domain}` } }
    });
    if (inUse) {
      return res.status(409).json({
        ok: false,
        message: 'Cannot delete domain. It is currently used by one or more users.'
      });
    }

    await domain.destroy();
    res.json({ ok: true, message: 'Domain deleted.' });
  } catch (error) {
    console.error('Delete domain error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

// ─── Toggle Domain (with in-use check) ─────────────────
exports.toggleDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const domain = await AllowedDomain.findByPk(id);
    if (!domain) return res.status(404).json({ ok: false, message: 'Domain not found.' });

    if (domain.is_active) {
      const inUse = await User.findOne({
        where: { email: { [Op.like]: `%@${domain.domain}` } }
      });
      if (inUse) {
        return res.status(409).json({
          ok: false,
          message: 'Cannot deactivate domain. It is currently used by one or more users.'
        });
      }
    }

    domain.is_active = !domain.is_active;
    await domain.save();
    res.json({ ok: true, domain });
  } catch (error) {
    console.error('Toggle domain error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};

// ─── Update Domain ──────────────────────────────────────
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