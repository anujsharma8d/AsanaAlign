const { getDb } = require('./lib/db');
const { sendJson } = require('./lib/utils');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end('Method not allowed');
  }

  try {
    const db = await getDb();
    const mongoHealthy = Boolean(db);
    return sendJson(res, {
      status: 'healthy',
      api: 'AsanaAlign Auth',
      mongo: mongoHealthy
    });
  } catch (error) {
    console.error('Health check error:', error);
    return sendJson(res, {
      status: 'unhealthy',
      error: 'Unable to connect to database.'
    }, 503);
  }
};
