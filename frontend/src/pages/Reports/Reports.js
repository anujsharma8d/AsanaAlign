import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, TrendingUp, Clock, Target, BarChart3 } from 'lucide-react';
import api from '../../utils/api';
import './Reports.css';

export default function Reports() {
    const [reportType, setReportType] = useState('daily');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadReport(reportType);
    }, [reportType]);

    const loadReport = async (type) => {
        setLoading(true);
        setError('');

        const userData = localStorage.getItem('yoga_user');
        
        if (!userData) {
            navigate('/login');
            return;
        }
        
        const user = JSON.parse(userData);
        
        try {
            const data = await api.getReport(user.email, type);
            setReportData(data);
        } catch (err) {
            console.error('Failed to load report:', err);
            setError('Failed to load report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (secs === 0) return `${mins}m`;
        return `${mins}m ${secs}s`;
    };

    const formatTimeDetailed = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}m ${secs}s`;
        }
        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
    };

    const getReportIcon = (type) => {
        switch(type) {
            case 'daily': return <Calendar size={20} />;
            case 'weekly': return <BarChart3 size={20} />;
            case 'monthly': return <TrendingUp size={20} />;
            default: return <Calendar size={20} />;
        }
    };

    if (loading) {
        return (
            <div className="reports-container">
                <nav className="reports-nav glass-panel">
                    <Link to="/progress" className="back-link">
                        <ArrowLeft size={24} />
                        <span>Back to Progress</span>
                    </Link>
                    <h2>Reports</h2>
                    <div style={{width: 100}}></div>
                </nav>
                <main className="reports-main">
                    <div className="loading-message">Loading report...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="reports-container">
            <nav className="reports-nav glass-panel">
                <Link to="/progress" className="back-link">
                    <ArrowLeft size={24} />
                    <span>Back to Progress</span>
                </Link>
                <h2>Reports</h2>
                <div style={{width: 100}}></div>
            </nav>

            <main className="reports-main">
                {error && <div className="error-message">{error}</div>}

                {/* Report Type Selector */}
                <div className="report-selector glass-panel animate-fade-in">
                    <button
                        className={`report-type-btn ${reportType === 'daily' ? 'active' : ''}`}
                        onClick={() => setReportType('daily')}
                    >
                        <Calendar size={20} />
                        <span>Daily</span>
                    </button>
                    <button
                        className={`report-type-btn ${reportType === 'weekly' ? 'active' : ''}`}
                        onClick={() => setReportType('weekly')}
                    >
                        <BarChart3 size={20} />
                        <span>Weekly</span>
                    </button>
                    <button
                        className={`report-type-btn ${reportType === 'monthly' ? 'active' : ''}`}
                        onClick={() => setReportType('monthly')}
                    >
                        <TrendingUp size={20} />
                        <span>Monthly</span>
                    </button>
                </div>

                {reportData && (
                    <>
                        {/* Report Header */}
                        <div className="report-header glass-panel animate-fade-in" style={{animationDelay: '0.1s'}}>
                            <div className="report-title">
                                {getReportIcon(reportData.type)}
                                <div>
                                    <h3>{reportData.type.charAt(0).toUpperCase() + reportData.type.slice(1)} Report</h3>
                                    <p className="report-period">{reportData.period.label}</p>
                                </div>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="report-summary animate-fade-in" style={{animationDelay: '0.2s'}}>
                            <div className="summary-card glass-panel">
                                <div className="summary-icon">
                                    <Target size={24} />
                                </div>
                                <div className="summary-info">
                                    <span className="summary-label">Total Sessions</span>
                                    <span className="summary-value gradient-text">{reportData.summary.totalSessions}</span>
                                </div>
                            </div>

                            <div className="summary-card glass-panel">
                                <div className="summary-icon">
                                    <Clock size={24} />
                                </div>
                                <div className="summary-info">
                                    <span className="summary-label">Total Time</span>
                                    <span className="summary-value gradient-text">{formatTimeDetailed(reportData.summary.totalTime)}</span>
                                </div>
                            </div>

                            <div className="summary-card glass-panel">
                                <div className="summary-icon">
                                    <BarChart3 size={24} />
                                </div>
                                <div className="summary-info">
                                    <span className="summary-label">Unique Poses</span>
                                    <span className="summary-value gradient-text">{reportData.summary.uniquePoses}</span>
                                </div>
                            </div>

                            <div className="summary-card glass-panel">
                                <div className="summary-icon">
                                    <TrendingUp size={24} />
                                </div>
                                <div className="summary-info">
                                    <span className="summary-label">Avg Session</span>
                                    <span className="summary-value gradient-text">{formatTime(reportData.summary.avgSessionTime)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Poses Table */}
                        <div className="poses-table-container glass-panel animate-fade-in" style={{animationDelay: '0.3s'}}>
                            <h3 className="table-title">Poses Breakdown</h3>
                            
                            {reportData.poses.length === 0 ? (
                                <div className="no-data">
                                    <p>No sessions recorded for this period.</p>
                                    <Link to="/start">
                                        <button className="btn-primary" style={{marginTop: 20}}>Start Practicing</button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="table-wrapper">
                                    <table className="poses-table">
                                        <thead>
                                            <tr>
                                                <th className="rank-col">#</th>
                                                <th className="pose-col">Pose</th>
                                                <th className="sessions-col">Sessions</th>
                                                <th className="time-col">Total Time</th>
                                                <th className="avg-col">Avg Time</th>
                                                <th className="last-col">Last Practiced</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.poses.map((pose, index) => (
                                                <tr key={index} className="pose-row">
                                                    <td className="rank-col">
                                                        <span className="rank-badge">{index + 1}</span>
                                                    </td>
                                                    <td className="pose-col">
                                                        <span className="pose-name">{pose.pose}</span>
                                                    </td>
                                                    <td className="sessions-col">
                                                        <span className="sessions-badge">{pose.sessions}</span>
                                                    </td>
                                                    <td className="time-col">
                                                        <span className="time-value">{formatTimeDetailed(pose.totalTime)}</span>
                                                    </td>
                                                    <td className="avg-col">
                                                        <span className="avg-value">{formatTime(Math.round(pose.totalTime / pose.sessions))}</span>
                                                    </td>
                                                    <td className="last-col">
                                                        <span className="last-date">
                                                            {new Date(pose.lastPracticed).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
