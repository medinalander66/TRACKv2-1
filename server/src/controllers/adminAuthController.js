const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs'); // ⚠️ palitan ng 'bcrypt' kung yun ang gamit mo na sa ibang parte ng app
const { sequelize, User, Admin, AccountCode } = require('../models');

exports.registerAdmin = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { username, password, account_code } = req.body;

    if (!username || !password || !account_code) {
      await t.rollback();
      return res.status(400).json({ ok: false, message: 'Username, password, and account code are required.' });
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      await t.rollback();
      return res.status(400).json({ ok: false, message: 'Username must be at least 3 characters.' });
    }
    if (password.length < 8) {
      await t.rollback();
      return res.status(400).json({ ok: false, message: 'Password must be at least 8 characters.' });
    }

    // ── 1. Validate account code ──
    const codeRecord = await AccountCode.findOne({ where: { code: account_code.trim() }, transaction: t });
    if (!codeRecord) {
      await t.rollback();
      return res.status(400).json({ ok: false, message: 'Invalid account code.' });
    }
    if (codeRecord.status !== 'unused') {
      await t.rollback();
      return res.status(400).json({ ok: false, message: 'This account code has already been used or is no longer valid.' });
    }
    if (!codeRecord.is_admin) {
      await t.rollback();
      return res.status(403).json({ ok: false, message: 'This account code is not valid for admin registration.' });
    }
    if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
      await t.rollback();
      return res.status(400).json({ ok: false, message: 'This account code has expired.' });
    }

    // ── 2. Username uniqueness (users.username is unique but nullable — check explicitly) ──
    const existingUser = await User.findOne({ where: { username: trimmedUsername }, transaction: t });
    if (existingUser) {
      await t.rollback();
      return res.status(409).json({ ok: false, message: 'Username is already taken.' });
    }

    // ── 3. Hash password ──
    const password_hash = await bcrypt.hash(password, 10);

    // ── 4. Create the user account ──
    // NOTE: users.email is NOT NULL/unique in the schema, but admins log in with
    // username+password only (no SSO/email). We synthesize a unique placeholder
    // email derived from the username so the column constraint is satisfied
    // without actually using email anywhere in the admin login flow.
    const placeholderEmail = `${trimmedUsername.toLowerCase()}@admin.local`;

    const newUser = await User.create({
      id: uuidv4(),
      username: trimmedUsername,
      email: placeholderEmail,
      password_hash,
      account_code_id: codeRecord.id,
      status: 'active',
    }, { transaction: t });

    // ── 5. Link the user as an admin ──
    const admin = await Admin.create({
      id: uuidv4(),
      user_id: newUser.id,
      admin_level: null,
      is_active: true,
    }, { transaction: t });

    // ── 6. Mark the account code as used ──
    codeRecord.status = 'used';
    codeRecord.used_at = new Date();
    codeRecord.used_by_user_id = newUser.id;
    await codeRecord.save({ transaction: t });

    await t.commit();

    res.status(201).json({
      ok: true,
      message: 'Admin account created successfully.',
      admin: { id: admin.id, user_id: newUser.id, username: newUser.username },
    });
  } catch (error) {
    await t.rollback();
    console.error('Admin register error:', error);
    res.status(500).json({ ok: false, message: 'Server error.' });
  }
};