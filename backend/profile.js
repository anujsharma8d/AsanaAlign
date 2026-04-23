const { getDb } = require('./lib/db');
const { parseBody, validateEmail, cleanUser, sendJson, sendError, methodNotAllowed, computeStats } = require('./lib/utils');

module.exports = async (req, res) => {
  const db = await getDb();

  if (req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const email = String(url.searchParams.get('email') || '').trim().toLowerCase();
    if (!email) {
      return sendError(res, 'Email is required.', 400);
    }

    if (!validateEmail(email)) {
      return sendError(res, 'Invalid email address.', 400);
    }

    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    const stats = await computeStats(db, email);
    return sendJson(res, { ...cleanUser(user), stats });
  }

  if (req.method === 'PUT') {
    const body = parseBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim();

    if (!email) {
      return sendError(res, 'Email is required.', 400);
    }
    if (name && !name.trim()) {
      return sendError(res, 'Name cannot be empty.', 400);
    }

    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    await db.collection('users').updateOne({ email }, { $set: { name: name || user.name } });
    const updated = await db.collection('users').findOne({ email });
    const stats = await computeStats(db, email);
    return sendJson(res, { ...cleanUser(updated), stats });
  }

  return methodNotAllowed(res);
};
