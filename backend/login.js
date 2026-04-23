const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getDb } = require('./lib/db');
const { parseBody, validateEmail, cleanUser, sendJson, sendError, methodNotAllowed, computeStats } = require('./lib/utils');

// Legacy SHA-256 hash used by the old Python backend
function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res);

  const body  = parseBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) return sendError(res, 'Email and password are required.', 400);
  if (!validateEmail(email)) return sendError(res, 'Invalid email address.', 400);

  try {
    const db   = await getDb();
    const user = await db.collection('users').findOne({ email });

    if (!user) return sendError(res, 'Email or password is incorrect.', 401);

    let passwordOk = false;
    let needsMigration = false;

    if (user.passwordHash) {
      // New bcrypt hash
      passwordOk = bcrypt.compareSync(password, user.passwordHash);
    } else if (user.password) {
      // Legacy SHA-256 hash from old Python backend
      passwordOk = user.password === sha256(password);
      needsMigration = passwordOk;
    }

    if (!passwordOk) return sendError(res, 'Email or password is incorrect.', 401);

    // Migrate legacy user to bcrypt + mark verified
    if (needsMigration) {
      await db.collection('users').updateOne(
        { email },
        {
          $set: {
            passwordHash: bcrypt.hashSync(password, 10),
            emailVerified: true,
            updatedAt: new Date().toISOString()
          },
          $unset: { password: '' }
        }
      );
    }

    // Accept both Python True (boolean) and JS true, and missing field for legacy users
    const verified = user.emailVerified === true || user.emailVerified === 'True' || needsMigration;
    if (!verified) return sendError(res, 'Email is not verified yet. Please complete signup.', 403);

    const stats = await computeStats(db, email);
    return sendJson(res, { user: { ...cleanUser(user), stats } });
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 'Server error while logging in.', 500);
  }
};
