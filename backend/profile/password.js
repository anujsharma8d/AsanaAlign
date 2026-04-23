const bcrypt = require('bcryptjs');
const { getDb } = require('../lib/db');
const { parseBody, validateEmail, sendJson, sendError, methodNotAllowed } = require('../lib/utils');

module.exports = async (req, res) => {
  if (req.method !== 'PUT') {
    return methodNotAllowed(res);
  }

  const body = parseBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');

  if (!email || !currentPassword || !newPassword) {
    return sendError(res, 'Email, current password, and new password are required.', 400);
  }
  if (!validateEmail(email)) {
    return sendError(res, 'Invalid email address.', 400);
  }
  if (newPassword.length < 6) {
    return sendError(res, 'New password must be at least 6 characters.', 400);
  }

  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return sendError(res, 'User not found.', 404);
    }
    if (!bcrypt.compareSync(currentPassword, user.passwordHash || '')) {
      return sendError(res, 'Current password is incorrect.', 401);
    }

    await db.collection('users').updateOne({ email }, { $set: { passwordHash: bcrypt.hashSync(newPassword, 10) } });
    return sendJson(res, { message: 'Password updated successfully.' });
  } catch (error) {
    return sendError(res, 'Server error while changing password.', 500);
  }
};
