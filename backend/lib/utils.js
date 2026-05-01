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

  const totalTime = Math.round(sessions.reduce((sum, item) => sum + Number(item.duration || 0), 0));
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
    duration: Math.round(Number(session.duration || 0)),
    accuracy: Number(session.accuracy || 0),
    createdAt: session.createdAt
  }));

  // Calculate daily progress (today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySessions = sessions.filter(session => {
    const sessionDate = new Date(session.createdAt);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  });
  const dailyTime = Math.round(todaySessions.reduce((sum, item) => sum + Number(item.duration || 0), 0));
  const dailySessions = todaySessions.length;

  // Calculate weekly progress (current week - Sunday to Saturday)
  const startOfWeek = new Date(today);
  const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday, 6 = Saturday
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const weeklySessions = sessions.filter(session => {
    const sessionDate = new Date(session.createdAt);
    return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
  });
  const weeklyTime = Math.round(weeklySessions.reduce((sum, item) => sum + Number(item.duration || 0), 0));
  const weeklySessionCount = weeklySessions.length;

  // Calculate days practiced this week
  const uniqueDaysThisWeek = new Set(
    weeklySessions.map(session => {
      const date = new Date(session.createdAt);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })
  ).size;

  // Calculate monthly progress (current month)
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthlySessions = sessions.filter(session => {
    const sessionDate = new Date(session.createdAt);
    return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear;
  });
  const monthlyTime = Math.round(monthlySessions.reduce((sum, item) => sum + Number(item.duration || 0), 0));
  const monthlySessionCount = monthlySessions.length;

  // Calculate days practiced this month
  const uniqueDaysThisMonth = new Set(
    monthlySessions.map(session => {
      const date = new Date(session.createdAt);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })
  ).size;

  // Calculate streak (consecutive days with at least one session)
  const streak = calculateStreak(sessions);

  // Calculate longest streak
  const longestStreak = calculateLongestStreak(sessions);

  // Generate activity calendar (last 90 days)
  const activityCalendar = generateActivityCalendar(sessions, 90);

  // Calculate unique poses ever practiced
  const uniquePosesEver = Object.keys(poseCounts).length;

  // Calculate achievements
  const achievements = computeAchievements({
    totalSessions,
    totalTime,
    currentStreak: streak,
    longestStreak,
    uniquePoses: uniquePosesEver,
    poseCounts,
    monthlyDaysActive: uniqueDaysThisMonth,
    monthlyTime,
  });

  return {
    totalTime,
    totalSessions,
    favoritePose: favoritePose === 'Unknown' ? 'None' : favoritePose,
    poseCounts,
    recentSessions,
    daily: {
      sessions: dailySessions,
      time: dailyTime
    },
    weekly: {
      sessions: weeklySessionCount,
      time: weeklyTime,
      daysActive: uniqueDaysThisWeek
    },
    monthly: {
      sessions: monthlySessionCount,
      time: monthlyTime,
      daysActive: uniqueDaysThisMonth
    },
    streak: {
      current: streak,
      longest: longestStreak
    },
    activityCalendar,
    achievements
  };
}

const MIN_STREAK_SECONDS = 300; // 5 minutes required per day to count toward streak

function calculateStreak(sessions) {
  if (sessions.length === 0) return 0;

  // Aggregate total time per day
  const dailyTime = {};
  sessions.forEach(session => {
    const date = new Date(session.createdAt);
    date.setHours(0, 0, 0, 0);
    const key = date.getTime();
    dailyTime[key] = (dailyTime[key] || 0) + Number(session.duration || 0);
  });

  // Keep only days that meet the 5-min minimum, sorted descending
  const qualifiedDates = Object.entries(dailyTime)
    .filter(([, time]) => time >= MIN_STREAK_SECONDS)
    .map(([ts]) => Number(ts))
    .sort((a, b) => b - a);

  if (qualifiedDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime     = today.getTime();
  const yesterdayTime = todayTime - 24 * 60 * 60 * 1000;

  // Streak is broken if the most recent qualifying day isn't today or yesterday
  const mostRecent = qualifiedDates[0];
  if (mostRecent !== todayTime && mostRecent !== yesterdayTime) return 0;

  let streak       = 1;
  let expectedDate = mostRecent - 24 * 60 * 60 * 1000;

  for (let i = 1; i < qualifiedDates.length; i++) {
    if (qualifiedDates[i] === expectedDate) {
      streak++;
      expectedDate -= 24 * 60 * 60 * 1000;
    } else {
      break;
    }
  }

  return streak;
}

function calculateLongestStreak(sessions) {
  if (sessions.length === 0) return 0;

  // Aggregate total time per day
  const dailyTime = {};
  sessions.forEach(session => {
    const date = new Date(session.createdAt);
    date.setHours(0, 0, 0, 0);
    const key = date.getTime();
    dailyTime[key] = (dailyTime[key] || 0) + Number(session.duration || 0);
  });

  // Keep only days that meet the 5-min minimum, sorted ascending
  const qualifiedDates = Object.entries(dailyTime)
    .filter(([, time]) => time >= MIN_STREAK_SECONDS)
    .map(([ts]) => Number(ts))
    .sort((a, b) => a - b);

  if (qualifiedDates.length === 0) return 0;

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < qualifiedDates.length; i++) {
    const dayDiff = (qualifiedDates[i] - qualifiedDates[i - 1]) / (24 * 60 * 60 * 1000);
    if (dayDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

function generateActivityCalendar(sessions, days = 90) {
  // Create a map of dates to session counts
  const activityMap = {};
  
  sessions.forEach(session => {
    const date = new Date(session.createdAt);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (!activityMap[dateKey]) {
      activityMap[dateKey] = {
        date: dateKey,
        count: 0,
        time: 0
      };
    }
    
    activityMap[dateKey].count += 1;
    activityMap[dateKey].time += Number(session.duration || 0);
  });

  // Generate array for last N days
  const calendar = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    calendar.push({
      date: dateKey,
      count: activityMap[dateKey]?.count || 0,
      time: activityMap[dateKey]?.time || 0,
      level: getActivityLevel(activityMap[dateKey]?.count || 0)
    });
  }

  return calendar;
}

function getActivityLevel(count) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count >= 3) return 3;
  return 0;
}

function computeAchievements({ totalSessions, totalTime, currentStreak, longestStreak, uniquePoses, poseCounts, monthlyDaysActive, monthlyTime }) {
  const ALL_POSES = ['Chair', 'Warrior', 'Cobra', 'Dog', 'Tree', 'Traingle', 'Shoulderstand'];
  const totalMinutes = Math.floor(totalTime / 60);

  const definitions = [
    // ── First Steps ──────────────────────────────────────────────────────
    {
      id: 'first_session',
      title: 'First Step',
      description: 'Complete your very first yoga session',
      icon: '🧘',
      category: 'milestone',
      condition: totalSessions >= 1,
      progress: Math.min(totalSessions, 1),
      target: 1,
    },
    // ── Session milestones ───────────────────────────────────────────────
    {
      id: 'sessions_10',
      title: 'Getting Started',
      description: 'Complete 10 sessions',
      icon: '⭐',
      category: 'milestone',
      condition: totalSessions >= 10,
      progress: Math.min(totalSessions, 10),
      target: 10,
    },
    {
      id: 'sessions_25',
      title: 'Dedicated Practitioner',
      description: 'Complete 25 sessions',
      icon: '🌟',
      category: 'milestone',
      condition: totalSessions >= 25,
      progress: Math.min(totalSessions, 25),
      target: 25,
    },
    {
      id: 'sessions_50',
      title: 'Half Century',
      description: 'Complete 50 sessions',
      icon: '💫',
      category: 'milestone',
      condition: totalSessions >= 50,
      progress: Math.min(totalSessions, 50),
      target: 50,
    },
    {
      id: 'sessions_100',
      title: 'Centurion',
      description: 'Complete 100 sessions',
      icon: '🏆',
      category: 'milestone',
      condition: totalSessions >= 100,
      progress: Math.min(totalSessions, 100),
      target: 100,
    },
    // ── Time milestones ──────────────────────────────────────────────────
    {
      id: 'time_30min',
      title: 'Warm Up',
      description: 'Practice for a total of 30 minutes',
      icon: '⏱️',
      category: 'time',
      condition: totalMinutes >= 30,
      progress: Math.min(totalMinutes, 30),
      target: 30,
    },
    {
      id: 'time_1hr',
      title: 'One Hour Strong',
      description: 'Practice for a total of 1 hour',
      icon: '⌛',
      category: 'time',
      condition: totalMinutes >= 60,
      progress: Math.min(totalMinutes, 60),
      target: 60,
    },
    {
      id: 'time_5hr',
      title: 'Time Keeper',
      description: 'Practice for a total of 5 hours',
      icon: '🕐',
      category: 'time',
      condition: totalMinutes >= 300,
      progress: Math.min(totalMinutes, 300),
      target: 300,
    },
    {
      id: 'time_10hr',
      title: 'Devoted Yogi',
      description: 'Practice for a total of 10 hours',
      icon: '🕰️',
      category: 'time',
      condition: totalMinutes >= 600,
      progress: Math.min(totalMinutes, 600),
      target: 600,
    },
    // ── Streak achievements ──────────────────────────────────────────────
    {
      id: 'streak_3',
      title: 'Habit Forming',
      description: 'Maintain a 3-day streak (5 min/day)',
      icon: '🔥',
      category: 'streak',
      condition: longestStreak >= 3,
      progress: Math.min(longestStreak, 3),
      target: 3,
    },
    {
      id: 'streak_7',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥🔥',
      category: 'streak',
      condition: longestStreak >= 7,
      progress: Math.min(longestStreak, 7),
      target: 7,
    },
    {
      id: 'streak_14',
      title: 'Fortnight Flow',
      description: 'Maintain a 14-day streak',
      icon: '🌊',
      category: 'streak',
      condition: longestStreak >= 14,
      progress: Math.min(longestStreak, 14),
      target: 14,
    },
    {
      id: 'streak_30',
      title: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      icon: '👑',
      category: 'streak',
      condition: longestStreak >= 30,
      progress: Math.min(longestStreak, 30),
      target: 30,
    },
    // ── Pose variety ─────────────────────────────────────────────────────
    {
      id: 'poses_3',
      title: 'Explorer',
      description: 'Try 3 different poses',
      icon: '🗺️',
      category: 'variety',
      condition: uniquePoses >= 3,
      progress: Math.min(uniquePoses, 3),
      target: 3,
    },
    {
      id: 'poses_5',
      title: 'Versatile Yogi',
      description: 'Try 5 different poses',
      icon: '🎯',
      category: 'variety',
      condition: uniquePoses >= 5,
      progress: Math.min(uniquePoses, 5),
      target: 5,
    },
    {
      id: 'poses_all',
      title: 'Complete Collection',
      description: 'Practice all 7 poses',
      icon: '🌈',
      category: 'variety',
      condition: uniquePoses >= ALL_POSES.length,
      progress: Math.min(uniquePoses, ALL_POSES.length),
      target: ALL_POSES.length,
    },
    // ── Pose mastery (10+ sessions on one pose) ──────────────────────────
    {
      id: 'master_any',
      title: 'Pose Master',
      description: 'Practice any single pose 10 times',
      icon: '🥋',
      category: 'mastery',
      condition: Object.values(poseCounts).some(c => c >= 10),
      progress: Math.min(Math.max(...Object.values(poseCounts), 0), 10),
      target: 10,
    },
    {
      id: 'master_25',
      title: 'Pose Expert',
      description: 'Practice any single pose 25 times',
      icon: '🎖️',
      category: 'mastery',
      condition: Object.values(poseCounts).some(c => c >= 25),
      progress: Math.min(Math.max(...Object.values(poseCounts), 0), 25),
      target: 25,
    },
    // ── Consistency ──────────────────────────────────────────────────────
    {
      id: 'monthly_15days',
      title: 'Consistent',
      description: 'Practice on 15 different days in a month',
      icon: '📅',
      category: 'consistency',
      condition: monthlyDaysActive >= 15,
      progress: Math.min(monthlyDaysActive, 15),
      target: 15,
    },
    {
      id: 'monthly_20days',
      title: 'Iron Discipline',
      description: 'Practice on 20 different days in a month',
      icon: '💪',
      category: 'consistency',
      condition: monthlyDaysActive >= 20,
      progress: Math.min(monthlyDaysActive, 20),
      target: 20,
    },
    // ── Special ──────────────────────────────────────────────────────────
    {
      id: 'monthly_1hr',
      title: 'Monthly Mover',
      description: 'Practice for 1 hour in a single month',
      icon: '🗓️',
      category: 'special',
      condition: Math.floor(monthlyTime / 60) >= 60,
      progress: Math.min(Math.floor(monthlyTime / 60), 60),
      target: 60,
    },
    {
      id: 'shoulderstand',
      title: 'Upside Down',
      description: 'Complete a Shoulderstand session',
      icon: '🙃',
      category: 'special',
      condition: (poseCounts['Shoulderstand'] || 0) >= 1,
      progress: Math.min(poseCounts['Shoulderstand'] || 0, 1),
      target: 1,
    },
    {
      id: 'warrior_spirit',
      title: 'Warrior Spirit',
      description: 'Complete 5 Warrior sessions',
      icon: '⚔️',
      category: 'special',
      condition: (poseCounts['Warrior'] || 0) >= 5,
      progress: Math.min(poseCounts['Warrior'] || 0, 5),
      target: 5,
    },
  ];

  return definitions.map(a => ({
    ...a,
    unlocked: a.condition,
    percent: Math.round((a.progress / a.target) * 100),
  }));
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
