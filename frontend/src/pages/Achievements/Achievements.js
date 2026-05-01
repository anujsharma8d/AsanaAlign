import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../utils/api';
import AchievementsPanel from '../../components/Achievements/Achievements';
import './Achievements.css';

export default function AchievementsPage() {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            const userData = localStorage.getItem('yoga_user');
            if (!userData) { navigate('/login'); return; }

            const user = JSON.parse(userData);
            try {
                const data = await api.getProgress(user.email);
                setAchievements(data.achievements || []);
            } catch (err) {
                setError('Failed to load achievements. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [navigate]);

    if (loading) {
        return (
            <div className="ach-page-container">
                <nav className="ach-page-nav glass-panel">
                    <Link to="/" className="back-link">
                        <ArrowLeft size={24} />
                        <span>Back to Home</span>
                    </Link>
                    <h2>Achievements</h2>
                    <div style={{ width: 120 }} />
                </nav>
                <main className="ach-page-main">
                    <div className="loading-message">Loading achievements...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="ach-page-container">
            <nav className="ach-page-nav glass-panel">
                <Link to="/" className="back-link">
                    <ArrowLeft size={24} />
                    <span>Back to Home</span>
                </Link>
                <h2>Achievements</h2>
                <div style={{ width: 120 }} />
            </nav>

            <main className="ach-page-main">
                {error && <div className="error-message">{error}</div>}
                <div className="animate-fade-in">
                    <AchievementsPanel achievements={achievements} />
                </div>
            </main>
        </div>
    );
}
