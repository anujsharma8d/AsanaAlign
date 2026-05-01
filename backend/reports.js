const { getDb } = require('./lib/db');
const { sendJson, sendError, methodNotAllowed, validateEmail } = require('./lib/utils');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return methodNotAllowed(res);
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const email = String(url.searchParams.get('email') || '').trim().toLowerCase();
  const type = String(url.searchParams.get('type') || 'daily').trim().toLowerCase();

  if (!email) {
    return sendError(res, 'Email is required.', 400);
  }
  if (!validateEmail(email)) {
    return sendError(res, 'Invalid email address.', 400);
  }
  if (!['daily', 'weekly', 'monthly'].includes(type)) {
    return sendError(res, 'Type must be daily, weekly, or monthly.', 400);
  }

  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    // Get date range based on type
    const { startDate, endDate } = getDateRange(type);

    // Fetch sessions in date range
    const sessions = await db.collection('sessions')
      .find({
        email,
        createdAt: {
          $gte: startDate.toISOString(),
          $lte: endDate.toISOString()
        }
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Group by pose
    const poseStats = {};
    let totalTime = 0;
    let totalSessions = 0;

    sessions.forEach(session => {
      const pose = session.pose || 'Unknown';
      const duration = Number(session.duration || 0);
      const accuracy = Number(session.accuracy || 0);

      if (!poseStats[pose]) {
        poseStats[pose] = {
          pose,
          sessions: 0,
          totalTime: 0,
          avgAccuracy: 0,
          accuracySum: 0,
          lastPracticed: session.createdAt
        };
      }

      poseStats[pose].sessions += 1;
      poseStats[pose].totalTime += duration;
      poseStats[pose].accuracySum += accuracy;
      poseStats[pose].avgAccuracy = Math.round(poseStats[pose].accuracySum / poseStats[pose].sessions);
      
      // Update last practiced if more recent
      if (new Date(session.createdAt) > new Date(poseStats[pose].lastPracticed)) {
        poseStats[pose].lastPracticed = session.createdAt;
      }

      totalTime += duration;
      totalSessions += 1;
    });

    // Convert to array and sort by total time (descending)
    const poseList = Object.values(poseStats).sort((a, b) => b.totalTime - a.totalTime);

    return sendJson(res, {
      type,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        label: getPeriodLabel(type, startDate)
      },
      summary: {
        totalSessions,
        totalTime,
        uniquePoses: poseList.length,
        avgSessionTime: totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0
      },
      poses: poseList
    });
  } catch (error) {
    console.error('Report error:', error);
    return sendError(res, 'Server error while generating report.', 500);
  }
};

function getDateRange(type) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  let startDate;

  switch (type) {
    case 'daily':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'weekly':
      startDate = new Date(now);
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      break;

    default:
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
}

function getPeriodLabel(type, startDate) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const date = new Date(startDate);
  
  switch (type) {
    case 'daily':
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    case 'weekly':
      const endOfWeek = new Date(date);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    
    case 'monthly':
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    
    default:
      return date.toLocaleDateString();
  }
}
