const rateLimit = require('express-rate-limit');

// ─── For Admin Register (guessable account codes = brute-force risk) ───
exports.adminRegisterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many registration attempts. Please try again later.' },
});

// ─── For Admin Login ───
exports.adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many login attempts. Please try again later.' },
});