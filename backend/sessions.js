const { getDb } = require('./lib/db');
const { parseBody, sendJson, sendError, methodNotAllowed, validateEmail } = require('./lib/utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  const body = parseBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  const pose = String(body.pose || '').trim();
  const duration = Number(body.duration);
  const accuracy = Number(body.accuracy || 0);

  if (!email || !pose || Number.isNaN(duration)) {
    return sendError(res, 'Email, pose, and duration are required.', 400);
  }
  if (!validateEmail(email)) {
    return sendError(res, 'Invalid email address.', 400);
  }

  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    const session = {
      email,
      pose,
      duration,
      accuracy,
      createdAt: new Date().toISOString()
    };

    await db.collection('sessions').insertOne(session);
    return sendJson(res, { message: 'Session saved.', session });
  } catch (error) {
    return sendError(res, 'Server error while saving session.', 500);
  }
};
