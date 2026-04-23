const bcrypt = require('bcryptjs');
const { getDb } = require('./lib/db');
const { parseBody, validateEmail, sendJson, sendError, methodNotAllowed } = require('./lib/utils');
const { sendEmail, EMAIL_ENABLED, DEV_MODE } = require('./lib/mailer');

function createOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res);

  const body     = parseBody(req);
  const email    = String(body.email    || '').trim().toLowerCase();
  const password = String(body.password || '');
  const name     = String(body.name     || '').trim();

  if (!email || !password || !name) return sendError(res, 'Email, name, and password are required.', 400);
  if (!validateEmail(email))        return sendError(res, 'Invalid email address.', 400);
  if (password.length < 6)          return sendError(res, 'Password must be at least 6 characters.', 400);

  try {
    const db       = await getDb();
    const existing = await db.collection('users').findOne({ email });

    if (existing) {
      // If the existing user was created by the old Python backend (has raw SHA-256 `password`
      // field instead of bcrypt `passwordHash`), it's a legacy account — block re-registration
      // and tell them to just log in instead.
      if (existing.passwordHash) {
        return sendError(res, 'This email is already registered. Please log in instead.', 409);
      }
      // Legacy Python user — they should use login (which auto-migrates them)
      return sendError(res, 'This email is already registered. Please log in — your account will be migrated automatically.', 409);
    }

    // Remove any stale pending OTP for this email before creating a new one
    await db.collection('otps').deleteMany({ email });

    const otpCode      = createOtp();
    const now          = new Date();
    const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 10);
    const expiresAt    = new Date(now.getTime() + expiryMinutes * 60000).toISOString();

    await db.collection('otps').insertOne({
      email,
      name,
      passwordHash: bcrypt.hashSync(password, 10),
      otp:       otpCode,
      used:      false,
      createdAt: now.toISOString(),
      expiresAt
    });

    const message = `Your Yoga Intelligence signup code is ${otpCode}. It expires in ${expiryMinutes} minutes.`;
    await sendEmail(email, 'Yoga Intelligence OTP Verification', message);

    const response = { message: 'OTP sent successfully.' };
    if (DEV_MODE || !EMAIL_ENABLED) {
      response.dev_otp = otpCode;
      response.message = 'Dev mode: OTP generated without email delivery.';
    }

    return sendJson(res, response);
  } catch (error) {
    console.error('Send OTP error:', error);
    return sendError(res, 'Server error while generating OTP.', 500);
  }
};
