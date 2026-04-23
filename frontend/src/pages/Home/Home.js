import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, BookOpen, BarChart2, LogOut, UserCircle } from 'lucide-react'

import './Home.css'

import yogaPoseImg from '../../utils/images/yoga_pose.png';

export default function Home() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('yoga_user');
        navigate('/login');
    };

    return (
        <div className='home-container'>
            <nav className='home-navbar glass-panel'>
                <div className='logo-container'>
                    <Activity className="logo-icon" size={32} color="var(--accent-primary)" />
                    <h1 className='home-logo'>AsanaAlign</h1>
                </div>
                <div className="nav-links">
                    <Link to="/progress" className="nav-link-btn">
                        <BarChart2 size={20} />
                        <span>Progress</span>
                    </Link>
                    <Link to="/profile" className="nav-link-btn">
                        <UserCircle size={20} />
                        <span>Profile</span>
                    </Link>
                    <button onClick={handleLogout} className="nav-link-btn logout-btn">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </nav>

            <main className="home-main">
                <div className="hero-content animate-fade-in">
                    <div className="badge">AI-Powered Yoga</div>
                    <h1 className="hero-title">
                        Perfect Your Pose with<br/>
                        <span className="gradient-text">Intelligent Feedback</span>
                    </h1>
                    <p className="hero-subtitle">
                        Your personal AI yoga trainer that analyzes your movements in real-time, 
                        providing instant feedback to help you master every asana safely.
                    </p>
                    
                    <div className="hero-actions">
                        <Link to='/start'>
                            <button className="btn-primary">
                                <Activity size={20} />
                                Start Practicing
                            </button>
                        </Link>
                    </div>
                    
                    <div className="hero-links">
                        <Link to='/tutorials' className="tutorial-link">
                            <BookOpen size={18} />
                            <span>View Tutorials & Troubleshooting</span>
                        </Link>
                    </div>
                </div>
                
                <div className="hero-visual animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="glow-orb orb-1"></div>
                    <div className="glow-orb orb-2"></div>
                    <div className="glass-panel image-container">
                        {/* We will use the existing yoga pose image but styled better */}
                        <img src={yogaPoseImg} alt="Yoga Pose" className="hero-image" />
                        <div className="floating-card card-1 glass-panel">
                            <div className="card-dot correct"></div>
                            <span>Warrior II - 98% Match</span>
                        </div>
                        <div className="floating-card card-2 glass-panel">
                            <div className="card-icon">⏱️</div>
                            <span>Hold: 45s / 60s</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
