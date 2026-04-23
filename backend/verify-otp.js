const { getDb } = require('./lib/db');
const { parseBody, validateEmail, cleanUser, sendJson, sendError, methodNotAllowed, computeStats } = require('./lib/utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  const body = parseBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  const otp = String(body.otp || '').trim();

  if (!email || !otp) {
    return sendError(res, 'Email and OTP are required.', 400);
  }
  if (!validateEmail(email)) {
    return sendError(res, 'Invalid email address.', 400);
  }

  try {
    const db = await getDb();
    const otpEntry = await db.collection('otps').findOne({ email, otp, used: false });

    if (!otpEntry) {
      return sendError(res, 'OTP is invalid or has already been used.', 400);
    }

    if (new Date() > new Date(otpEntry.expiresAt)) {
      return sendError(res, 'OTP has expired.', 400);
    }

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return sendError(res, 'Email is already registered.', 409);
    }

    const user = {
      email,
      name: otpEntry.name,
      passwordHash: otpEntry.passwordHash,
      createdAt: new Date().toISOString(),
      emailVerified: true
    };

    await db.collection('users').insertOne(user);
    await db.collection('otps').updateOne({ _id: otpEntry._id }, { $set: { used: true } });

    const stats = await computeStats(db, email);
    return sendJson(res, { user: { ...cleanUser(user), stats } });
  } catch (error) {
    return sendError(res, 'Server error while verifying OTP.', 500);
  }
};
