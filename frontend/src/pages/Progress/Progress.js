import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Clock, Activity, Target } from 'lucide-react';
import api from '../../utils/api';
import './Progress.css';

export default function Progress() {
    const [stats, setStats] = useState({
        totalTime: 0,
        totalSessions: 0,
        favoritePose: 'None',
        recentSessions: []
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
                    recentSessions: data.recentSessions || []
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
                        recentSessions: storedSessions.reverse().slice(0, 10)
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        loadProgress();
    }, [navigate]);

    const formatTime = (seconds) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
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
                <div style={{width: 100}}></div> {/* Spacer for centering */}
            </nav>

            <main className="progress-main">
                {error && <div className="error-message">{error}</div>}
                
                <div className="stats-header animate-fade-in">
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

                <div className="recent-activity glass-panel animate-fade-in" style={{animationDelay: '0.2s'}}>
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
