import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Clock, Activity, Target, Flame, Calendar, TrendingUp } from 'lucide-react';
import api from '../../utils/api';
import ActivityCalendar from '../../components/ActivityCalendar/ActivityCalendar';
import './Progress.css';

export default function Progress() {
    const [stats, setStats] = useState({
        totalTime: 0,
        totalSessions: 0,
        favoritePose: 'None',
        recentSessions: [],
        daily: { sessions: 0, time: 0 },
        weekly: { sessions: 0, time: 0, daysActive: 0 },
        monthly: { sessions: 0, time: 0, daysActive: 0 },
        streak: { current: 0, longest: 0 },
        activityCalendar: [],
        achievements: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const loadProgress = async () => {
            // Get user from localStorage
            const userData = localStorage.getItem('yoga_user');
            
            if (!userData) {
                // No user logged in, redirect to login
                navigate('/login');
                return;
            }
            
            const user = JSON.parse(userData);
            
            try {
                // Try to get progress from backend
                const data = await api.getProgress(user.email);
                
                setStats({
                    totalTime: data.totalTime || 0,
                    totalSessions: data.totalSessions || 0,
                    favoritePose: data.favoritePose || 'None',
                    recentSessions: data.recentSessions || [],
                    daily: data.daily || { sessions: 0, time: 0 },
                    weekly: data.weekly || { sessions: 0, time: 0, daysActive: 0 },
                    monthly: data.monthly || { sessions: 0, time: 0, daysActive: 0 },
                    streak: data.streak || { current: 0, longest: 0 },
                    activityCalendar: data.activityCalendar || [],
                    achievements: data.achievements || []
                });
            } catch (err) {
                console.error('Failed to load progress from backend:', err);
                // Fallback to localStorage if backend fails
                const storedSessions = JSON.parse(localStorage.getItem('yoga_sessions') || '[]');
                
                if (storedSessions.length > 0) {
                    let totalTime = 0;
                    const poseCounts = {};
                    
                    storedSessions.forEach(session => {
                        totalTime += session.duration;
                        poseCounts[session.pose] = (poseCounts[session.pose] || 0) + 1;
                    });

                    let maxCount = 0;
                    let favorite = 'None';
                    for (const [pose, count] of Object.entries(poseCounts)) {
                        if (count > maxCount) {
                            maxCount = count;
                            favorite = pose;
                        }
                    }

                    setStats({
                        totalTime: Math.round(totalTime),
                        totalSessions: storedSessions.length,
                        favoritePose: favorite,
                        recentSessions: storedSessions.reverse().slice(0, 10),
                        daily: { sessions: 0, time: 0 },
                        weekly: { sessions: 0, time: 0, daysActive: 0 },
                        monthly: { sessions: 0, time: 0, daysActive: 0 },
                        streak: { current: 0, longest: 0 },
                        activityCalendar: [],
                        achievements: []
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        loadProgress();
    }, [navigate]);

    const formatTime = (seconds) => {
        // Round to nearest integer to avoid floating point issues
        const roundedSeconds = Math.round(seconds);
        
        if (roundedSeconds < 60) return `${roundedSeconds}s`;
        
        const mins = Math.floor(roundedSeconds / 60);
        const secs = roundedSeconds % 60;
        
        if (secs === 0) return `${mins}m`;
        return `${mins}m ${secs}s`;
    };

    if (loading) {
        return (
            <div className="progress-container">
                <nav className="progress-nav glass-panel">
                    <Link to="/" className="back-link">
                        <ArrowLeft size={24} />
                        <span>Back to Home</span>
                    </Link>
                    <h2>Your Progress</h2>
                    <div style={{width: 100}}></div>
                </nav>
                <main className="progress-main">
                    <div className="loading-message">Loading your progress...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="progress-container">
            <nav className="progress-nav glass-panel">
                <Link to="/" className="back-link">
                    <ArrowLeft size={24} />
                    <span>Back to Home</span>
                </Link>
                <h2>Your Progress</h2>
                <Link to="/reports" className="reports-link">
                    <Target size={20} />
                    <span>View Reports</span>
                </Link>
            </nav>

            <main className="progress-main">
                {error && <div className="error-message">{error}</div>}
                
                {/* Combined Calendar and Streak Section */}
                <div className="calendar-streak-section animate-fade-in">
                    <div className="calendar-streak-card glass-panel">
                        {/* Streak Header */}
                        <div className="streak-header">
                            <div className="streak-compact">
                                <Flame size={24} className={stats.streak.current > 0 ? 'flame-active' : 'flame-inactive'} />
                                <div className="streak-info-compact">
                                    <span className="streak-number-compact">{stats.streak.current}</span>
                                    <span className="streak-label-compact">Day Streak</span>
                                    {stats.streak.current === 0 && (
                                        <span className="streak-hint">5 min/day to streak</span>
                                    )}
                                </div>
                            </div>
                            {stats.streak.longest > 0 && (
                                <div className="longest-streak-compact">
                                    <Award size={12} />
                                    <span>Best: {stats.streak.longest}</span>
                                </div>
                            )}
                        </div>

                        {/* Calendar */}
                        <ActivityCalendar activityData={stats.activityCalendar} />
                    </div>
                </div>

                {/* Daily & Weekly & Monthly Progress */}
                <div className="progress-grid animate-fade-in" style={{animationDelay: '0.1s'}}>
                    <div className="progress-card glass-panel">
                        <div className="progress-header">
                            <Calendar size={24} className="progress-icon daily-icon" />
                            <h3>Today's Progress</h3>
                        </div>
                        <div className="progress-stats">
                            <div className="progress-stat">
                                <span className="stat-value gradient-text">{stats.daily.sessions}</span>
                                <span className="stat-label">Sessions</span>
                            </div>
                            <div className="progress-divider"></div>
                            <div className="progress-stat">
                                <span className="stat-value gradient-text">{formatTime(stats.daily.time)}</span>
                                <span className="stat-label">Time</span>
                            </div>
                        </div>
                    </div>

                    <div className="progress-card glass-panel">
                        <div className="progress-header">
                            <Activity size={24} className="progress-icon weekly-icon" />
                            <h3>This Week</h3>
                        </div>
                        <div className="progress-stats">
                            <div className="progress-stat">
                                <span className="stat-value gradient-text">{stats.weekly.sessions}</span>
                                <span className="stat-label">Sessions</span>
                            </div>
                            <div className="progress-divider"></div>
                            <div className="progress-stat">
                                <span className="stat-value gradient-text">{stats.weekly.daysActive}</span>
                                <span className="stat-label">Days Active</span>
                            </div>
                            <div className="progress-divider"></div>
                            <div className="progress-stat">
                                <span className="stat-value gradient-text">{formatTime(stats.weekly.time)}</span>
                                <span className="stat-label">Time</span>
                            </div>
                        </div>
                    </div>

                    <div className="progress-card glass-panel">
                        <div className="progress-header">
                            <TrendingUp size={24} className="progress-icon monthly-icon" />
                            <h3>This Month</h3>
                        </div>
                        <div className="progress-stats">
                            <div className="progress-stat">
                                <span className="stat-value gradient-text">{stats.monthly.sessions}</span>
                                <span className="stat-label">Sessions</span>
                            </div>
                            <div className="progress-divider"></div>
                            <div className="progress-stat">
                                <span className="stat-value gradient-text">{stats.monthly.daysActive}</span>
                                <span className="stat-label">Days Active</span>
                            </div>
                            <div className="progress-divider"></div>
                            <div className="progress-stat">
                                <span className="stat-value gradient-text">{formatTime(stats.monthly.time)}</span>
                                <span className="stat-label">Time</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overall Stats */}
                <div className="stats-header animate-fade-in" style={{animationDelay: '0.2s'}}>
                    <div className="stat-card glass-panel">
                        <div className="stat-icon-wrapper time-icon">
                            <Clock size={28} />
                        </div>
                        <div className="stat-info">
                            <h3>Total Time</h3>
                            <p className="gradient-text">{formatTime(stats.totalTime)}</p>
                        </div>
                    </div>

                    <div className="stat-card glass-panel">
                        <div className="stat-icon-wrapper session-icon">
                            <Activity size={28} />
                        </div>
                        <div className="stat-info">
                            <h3>Total Sessions</h3>
                            <p className="gradient-text">{stats.totalSessions}</p>
                        </div>
                    </div>

                    <div className="stat-card glass-panel">
                        <div className="stat-icon-wrapper pose-icon">
                            <Award size={28} />
                        </div>
                        <div className="stat-info">
                            <h3>Favorite Pose</h3>
                            <p className="gradient-text">{stats.favoritePose}</p>
                        </div>
                    </div>
                </div>

                <div className="recent-activity glass-panel animate-fade-in" style={{animationDelay: '0.3s'}}>
                    <div className="activity-header">
                        <Target size={24} className="activity-icon" />
                        <h3>Recent Sessions</h3>
                    </div>
                    
                    {stats.recentSessions.length === 0 ? (
                        <div className="no-data">
                            <p>You haven't completed any sessions yet. Start a yoga session to see your progress here!</p>
                            <Link to="/start">
                                <button className="btn-primary" style={{marginTop: 20}}>Start Practicing</button>
                            </Link>
                        </div>
                    ) : (
                        <div className="activity-list">
                            {stats.recentSessions.map((session, index) => {
                                const sessionDate = new Date(session.createdAt || session.date);
                                return (
                                <div key={index} className="activity-item">
                                    <div className="activity-details">
                                        <h4>{session.pose}</h4>
                                        <span className="activity-date">{sessionDate.toLocaleDateString()} at {sessionDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <div className="activity-duration">
                                        <Clock size={16} />
                                        {formatTime(Math.round(session.duration))}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
