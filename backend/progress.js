const { getDb } = require('./lib/db');
const { sendJson, sendError, methodNotAllowed, validateEmail, computeStats } = require('./lib/utils');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return methodNotAllowed(res);
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const email = String(url.searchParams.get('email') || '').trim().toLowerCase();

  if (!email) {
    return sendError(res, 'Email is required.', 400);
  }
  if (!validateEmail(email)) {
    return sendError(res, 'Invalid email address.', 400);
  }

  try {
    const db = await getDb();
    const stats = await computeStats(db, email);
    return sendJson(res, stats);
  } catch (error) {
    return sendError(res, 'Server error while loading progress.', 500);
  }
};
