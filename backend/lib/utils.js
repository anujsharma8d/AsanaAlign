function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (req.body && typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }

  return {};
}

function validateEmail(email) {
  return typeof email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function cleanUser(user) {
  if (!user) return null;
  return {
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    emailVerified: user.emailVerified === true || user.emailVerified === 'True'
  };
}

function sendJson(res, payload, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function sendError(res, message, status = 400) {
  return sendJson(res, { error: message }, status);
}

function methodNotAllowed(res) {
  return sendError(res, 'Method not allowed', 405);
}

async function computeStats(db, email) {
  const sessions = await db.collection('sessions').find({ email }).sort({ createdAt: -1 }).toArray();

  const totalTime = sessions.reduce((sum, item) => sum + Number(item.duration || 0), 0);
  const totalSessions = sessions.length;
  const poseCounts = {};
  let favoritePose = 'None';

  sessions.forEach((session) => {
    const pose = session.pose || 'Unknown';
    poseCounts[pose] = (poseCounts[pose] || 0) + 1;
    if (poseCounts[pose] > (poseCounts[favoritePose] || 0)) {
      favoritePose = pose;
    }
  });

  const recentSessions = sessions.slice(0, 10).map((session) => ({
    pose: session.pose,
    duration: Number(session.duration || 0),
    accuracy: Number(session.accuracy || 0),
    createdAt: session.createdAt
  }));

  return {
    totalTime,
    totalSessions,
    favoritePose: favoritePose === 'Unknown' ? 'None' : favoritePose,
    poseCounts,
    recentSessions
  };
}

module.exports = {
  parseBody,
  validateEmail,
  cleanUser,
  sendJson,
  sendError,
  methodNotAllowed,
  computeStats
};
