import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Mail, Shield, Clock, Activity,
    Award, Edit2, Check, X, Lock, LogOut, CheckCircle
} from 'lucide-react';
import api from '../../utils/api';
import './Profile.css';

export default function Profile() {
    const navigate = useNavigate();

    const [profile, setProfile]   = useState(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    // Edit name
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput]     = useState('');
    const [nameLoading, setNameLoading] = useState(false);
    const [nameMsg, setNameMsg]         = useState('');

    // Change password
    const [pwSection, setPwSection]       = useState(false);
    const [currentPw, setCurrentPw]       = useState('');
    const [newPw, setNewPw]               = useState('');
    const [confirmPw, setConfirmPw]       = useState('');
    const [pwLoading, setPwLoading]       = useState(false);
    const [pwMsg, setPwMsg]               = useState({ text: '', ok: false });

    const getUser = () => {
        const raw = localStorage.getItem('yoga_user');
        return raw ? JSON.parse(raw) : null;
    };

    // ── load profile ──────────────────────────────────────────────────────────
    useEffect(() => {
        const user = getUser();
        if (!user) { navigate('/login'); return; }

        api.getProfile(user.email)
            .then(data => {
                setProfile(data);
                setNameInput(data.name);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [navigate]);

    // ── save name ─────────────────────────────────────────────────────────────
    const handleSaveName = async () => {
        if (!nameInput.trim()) return;
        setNameLoading(true); setNameMsg('');
        try {
            await api.updateProfile(profile.email, { name: nameInput.trim() });
            setProfile(p => ({ ...p, name: nameInput.trim() }));
            // keep localStorage in sync
            const user = getUser();
            localStorage.setItem('yoga_user', JSON.stringify({ ...user, name: nameInput.trim() }));
            setEditingName(false);
            setNameMsg('Name updated.');
            setTimeout(() => setNameMsg(''), 3000);
        } catch (err) {
            setNameMsg(err.message);
        } finally {
            setNameLoading(false);
        }
    };

    // ── change password ───────────────────────────────────────────────────────
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPw !== confirmPw) { setPwMsg({ text: 'Passwords do not match.', ok: false }); return; }
        if (newPw.length < 6)    { setPwMsg({ text: 'Password must be at least 6 characters.', ok: false }); return; }
        setPwLoading(true); setPwMsg({ text: '', ok: false });
        try {
            await api.changePassword(profile.email, currentPw, newPw);
            setPwMsg({ text: 'Password changed successfully.', ok: true });
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
            setTimeout(() => { setPwSection(false); setPwMsg({ text: '', ok: false }); }, 2000);
        } catch (err) {
            setPwMsg({ text: err.message, ok: false });
        } finally {
            setPwLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('yoga_user');
        navigate('/login');
    };

    // ── helpers ───────────────────────────────────────────────────────────────
    const formatTime = (s) => {
        if (!s) return '0s';
        if (s < 60) return `${s}s`;
        const m = Math.floor(s / 60), sec = s % 60;
        return sec ? `${m}m ${sec}s` : `${m}m`;
    };

    const formatDate = (iso) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const initials = (name) =>
        name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

    // ── render ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="profile-container">
            <nav className="profile-nav glass-panel">
                <Link to="/" className="back-link"><ArrowLeft size={24} /><span>Back to Home</span></Link>
                <h2>Profile</h2>
                <div style={{ width: 120 }} />
            </nav>
            <main className="profile-main">
                <div className="loading-message">Loading profile…</div>
            </main>
        </div>
    );

    if (error) return (
        <div className="profile-container">
            <nav className="profile-nav glass-panel">
                <Link to="/" className="back-link"><ArrowLeft size={24} /><span>Back to Home</span></Link>
                <h2>Profile</h2>
                <div style={{ width: 120 }} />
            </nav>
            <main className="profile-main">
                <div className="profile-error-card glass-panel">
                    <div className="profile-error-icon">⚠️</div>
                    <h3>Couldn't load profile</h3>
                    <p>{error}</p>
                    <button className="btn-primary" onClick={() => window.location.reload()}>
                        Retry
                    </button>
                </div>
            </main>
        </div>
    );

    const { stats } = profile;

    return (
        <div className="profile-container">
            {/* ── Nav ── */}
            <nav className="profile-nav glass-panel">
                <Link to="/" className="back-link"><ArrowLeft size={24} /><span>Back to Home</span></Link>
                <h2>Profile</h2>
                <button className="nav-link-btn logout-btn" onClick={handleLogout}>
                    <LogOut size={18} /><span>Logout</span>
                </button>
            </nav>

            <main className="profile-main">

                {/* ── Avatar + name card ── */}
                <div className="profile-hero glass-panel animate-fade-in">
                    <div className="profile-avatar">
                        {initials(profile.name)}
                    </div>

                    <div className="profile-identity">
                        {editingName ? (
                            <div className="name-edit-row">
                                <input
                                    className="name-input"
                                    value={nameInput}
                                    onChange={e => setNameInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                                    autoFocus
                                />
                                <button className="icon-btn confirm" onClick={handleSaveName} disabled={nameLoading}>
                                    <Check size={18} />
                                </button>
                                <button className="icon-btn cancel" onClick={() => { setEditingName(false); setNameInput(profile.name); }}>
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="name-display-row">
                                <h1 className="profile-name">{profile.name}</h1>
                                <button className="icon-btn edit" onClick={() => setEditingName(true)} title="Edit name">
                                    <Edit2 size={16} />
                                </button>
                            </div>
                        )}
                        {nameMsg && <p className="inline-msg">{nameMsg}</p>}

                        <div className="profile-meta">
                            <span><Mail size={14} /> {profile.email}</span>
                            {profile.emailVerified && <span className="verified-badge"><CheckCircle size={14} /> Verified</span>}
                        </div>
                        <p className="member-since">Member since {formatDate(profile.createdAt)}</p>
                    </div>
                </div>

                {/* ── Stats row ── */}
                <div className="profile-stats animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="pstat-card glass-panel">
                        <div className="pstat-icon time-icon"><Clock size={26} /></div>
                        <div className="pstat-info">
                            <span className="pstat-label">Total Time</span>
                            <span className="pstat-value gradient-text">{formatTime(stats.totalTime)}</span>
                        </div>
                    </div>
                    <div className="pstat-card glass-panel">
                        <div className="pstat-icon session-icon"><Activity size={26} /></div>
                        <div className="pstat-info">
                            <span className="pstat-label">Sessions</span>
                            <span className="pstat-value gradient-text">{stats.totalSessions}</span>
                        </div>
                    </div>
                    <div className="pstat-card glass-panel">
                        <div className="pstat-icon pose-icon"><Award size={26} /></div>
                        <div className="pstat-info">
                            <span className="pstat-label">Favourite Pose</span>
                            <span className="pstat-value gradient-text">{stats.favoritePose}</span>
                        </div>
                    </div>
                </div>

                {/* ── Pose breakdown ── */}
                {Object.keys(stats.poseCounts).length > 0 && (
                    <div className="pose-breakdown glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="section-header">
                            <Activity size={20} className="section-icon" />
                            <h3>Pose Breakdown</h3>
                        </div>
                        <div className="pose-bars">
                            {Object.entries(stats.poseCounts)
                                .sort((a, b) => b[1] - a[1])
                                .map(([pose, count]) => {
                                    const max = Math.max(...Object.values(stats.poseCounts));
                                    const pct = Math.round((count / max) * 100);
                                    return (
                                        <div key={pose} className="pose-bar-row">
                                            <span className="pose-bar-label">{pose}</span>
                                            <div className="pose-bar-track">
                                                <div className="pose-bar-fill" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="pose-bar-count">{count}</span>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* ── Account settings ── */}
                <div className="account-settings glass-panel animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <div className="section-header">
                        <Shield size={20} className="section-icon" />
                        <h3>Account Settings</h3>
                    </div>

                    <div className="settings-row">
                        <div className="settings-row-info">
                            <User size={18} />
                            <div>
                                <p className="settings-label">Display Name</p>
                                <p className="settings-value">{profile.name}</p>
                            </div>
                        </div>
                        <button className="btn-outline" onClick={() => setEditingName(true)}>
                            <Edit2 size={15} /> Edit
                        </button>
                    </div>

                    <div className="settings-row">
                        <div className="settings-row-info">
                            <Mail size={18} />
                            <div>
                                <p className="settings-label">Email Address</p>
                                <p className="settings-value">{profile.email}</p>
                            </div>
                        </div>
                        {profile.emailVerified && (
                            <span className="verified-badge"><CheckCircle size={14} /> Verified</span>
                        )}
                    </div>

                    {/* Change password toggle */}
                    <div className="settings-row">
                        <div className="settings-row-info">
                            <Lock size={18} />
                            <div>
                                <p className="settings-label">Password</p>
                                <p className="settings-value">••••••••</p>
                            </div>
                        </div>
                        <button className="btn-outline" onClick={() => { setPwSection(v => !v); setPwMsg({ text: '', ok: false }); }}>
                            <Lock size={15} /> {pwSection ? 'Cancel' : 'Change'}
                        </button>
                    </div>

                    {pwSection && (
                        <form className="pw-form" onSubmit={handleChangePassword} noValidate>
                            {pwMsg.text && (
                                <div className={pwMsg.ok ? 'login-success' : 'login-error'}>{pwMsg.text}</div>
                            )}
                            <input className="pw-input" type="password" placeholder="Current password"
                                value={currentPw} onChange={e => setCurrentPw(e.target.value)} autoComplete="current-password" />
                            <input className="pw-input" type="password" placeholder="New password (min 6 chars)"
                                value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" />
                            <input className="pw-input" type="password" placeholder="Confirm new password"
                                value={confirmPw} onChange={e => setConfirmPw(e.target.value)} autoComplete="new-password" />
                            <button type="submit" className="btn-primary pw-submit" disabled={pwLoading}>
                                {pwLoading ? 'Saving…' : 'Update Password'}
                            </button>
                        </form>
                    )}

                    <div className="settings-row danger-row">
                        <div className="settings-row-info">
                            <LogOut size={18} />
                            <div>
                                <p className="settings-label">Session</p>
                                <p className="settings-value">Signed in as {profile.email}</p>
                            </div>
                        </div>
                        <button className="btn-outline danger-btn" onClick={handleLogout}>
                            <LogOut size={15} /> Sign Out
                        </button>
                    </div>
                </div>

            </main>
        </div>
    );
}
