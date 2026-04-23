const bcrypt = require('bcryptjs');
const { getDb } = require('./lib/db');
const { parseBody, validateEmail, cleanUser, sendJson, sendError, methodNotAllowed, computeStats } = require('./lib/utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  const body = parseBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const name = String(body.name || '').trim();

  if (!email || !password || !name) {
    return sendError(res, 'Email, name, and password are required.', 400);
  }
  if (!validateEmail(email)) {
    return sendError(res, 'Invalid email address.', 400);
  }
  if (password.length < 6) {
    return sendError(res, 'Password must be at least 6 characters.', 400);
  }

  try {
    const db = await getDb();
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      return sendError(res, 'Email is already registered.', 409);
    }

    const user = {
      email,
      name,
      passwordHash: bcrypt.hashSync(password, 10),
      createdAt: new Date().toISOString(),
      emailVerified: false
    };

    await db.collection('users').insertOne(user);
    const stats = await computeStats(db, email);
    return sendJson(res, { user: { ...cleanUser(user), stats } });
  } catch (error) {
    return sendError(res, 'Server error while registering user.', 500);
  }
};
