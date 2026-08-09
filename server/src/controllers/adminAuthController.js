// const { v4: uuidv4 } = require('uuid');
// const bcrypt = require('bcryptjs');
// const { Admin, AccountCode } = require('../models');

// exports.registerAdmin = async (req, res) => {
//   try {
//     const { username, password, account_code } = req.body;

//     if (!username || !password || !account_code) {
//       return res.status(400).json({ ok: false, message: 'Username, password, and account code are required.' });
//     }
//     if (password.length < 8) {
//       return res.status(400).json({ ok: false, message: 'Password must be at least 8 characters.' });
//     }

//     // ── 1. Validate account code ──
//     const codeRecord = await AccountCode.findOne({ where: { code: account_code } });
//     if (!codeRecord) {
//       return res.status(400).json({ ok: false, message: 'Invalid account code.' });
//     }
//     if (codeRecord.status !== 'unused') {
//       return res.status(400).json({ ok: false, message: 'This account code has already been used or is no longer valid.' });
//     }
//     if (!codeRecord.is_admin) {
//       return res.status(403).json({ ok: false, message: 'This account code is not valid for admin registration.' });
//     }
//     if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
//       return res.status(400).json({ ok: false, message: 'This account code has expired.' });
//     }

//     // ── 2. Username uniqueness ──
//     const existingAdmin = await Admin.findOne({ where: { username: username.trim() } });
//     if (existingAdmin) {
//       return res.status(409).json({ ok: false, message: 'Username is already taken.' });
//     }

//     // ── 3. Hash password ──
//     const password_hash = await bcrypt.hash(password, 10);

//     // ── 4. Create admin ──
//     const admin = await Admin.create({
//       id: uuidv4(),
//       username: username.trim(),
//       password_hash,
//       department_id: codeRecord.department_id || null,
//       office_id: codeRecord.office_id || null,
//       position_id: codeRecord.position_id || null,
//       role_id: codeRecord.role_id || null,
//     });

//     // ── 5. Mark code as used ──
//     codeRecord.status = 'used';
//     codeRecord.used_at = new Date();
//     await codeRecord.save();

//     res.status(201).json({
//       ok: true,
//       message: 'Admin account created successfully.',
//       admin: { id: admin.id, username: admin.username },
//     });
//   } catch (error) {
//     console.error('Admin register error:', error);
//     res.status(500).json({ ok: false, message: 'Server error.' });
//   }
// };