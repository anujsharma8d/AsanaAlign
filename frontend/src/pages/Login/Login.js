import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, LogIn, User, Mail, Lock, UserPlus } from 'lucide-react';
import api from '../../utils/api';
import './Login.css';

export default function Login({ initialMode = 'login' }) {
    const [mode, setMode] = useState(initialMode);

    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [name, setName]         = useState('');

    const [error, setError]     = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const switchMode = (next) => {
        setError('');
        setSuccess('');
        setMode(next);
    };

    // ── login ─────────────────────────────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) { setError('Please enter both email and password.'); return; }
        setLoading(true); setError('');
        try {
            const data = await api.login(email, password);
            localStorage.setItem('yoga_user', JSON.stringify({
                email: data.user.email,
                name: data.user.name,
                loggedInAt: new Date().toISOString()
            }));
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── signup ────────────────────────────────────────────────────────────────
    const handleSignup = async (e) => {
        e.preventDefault();
        if (!name || !email || !password) { setError('All fields are required.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true); setError('');
        try {
            const data = await api.register(email, password, name);
            localStorage.setItem('yoga_user', JSON.stringify({
                email: data.user.email,
                name: data.user.name,
                loggedInAt: new Date().toISOString()
            }));
            navigate('/');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div className="login-container">
            <div className="login-background">
                <div className="glow-orb orb-login-1"></div>
                <div className="glow-orb orb-login-2"></div>
            </div>

            <div className="login-card glass-panel animate-fade-in">

                {/* ── Header ── */}
                <div className="login-header">
                    <Activity className="login-logo-icon" size={48} color="var(--accent-primary)" />
                    {mode === 'login'  && <><h2>Welcome Back</h2><p>Log in to continue your yoga journey.</p></>}
                    {mode === 'signup' && <><h2>Create Account</h2><p>Join AsanaAlign today.</p></>}
                </div>

                {/* ── Alerts ── */}
                {error   && <div className="login-error"   role="alert">{error}</div>}
                {success && <div className="login-success" role="status">{success}</div>}

                {/* ══════════════ LOGIN FORM ══════════════ */}
                {mode === 'login' && (
                    <form onSubmit={handleLogin} className="login-form" noValidate>
                        <div className="form-group">
                            <label htmlFor="login-email">Email</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={20} />
                                <input id="login-email" type="email" placeholder="Enter your email"
                                    value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="login-password">Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input id="login-password" type="password" placeholder="Enter your password"
                                    value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary login-btn" disabled={loading}>
                            {loading ? 'Logging in…' : <><LogIn size={18} /> Log In</>}
                        </button>
                        <p className="auth-switch">
                            Don't have an account?{' '}
                            <button type="button" className="link-btn" onClick={() => switchMode('signup')}>
                                Sign Up
                            </button>
                        </p>
                    </form>
                )}

                {/* ══════════════ SIGNUP FORM ══════════════ */}
                {mode === 'signup' && (
                    <form onSubmit={handleSignup} className="login-form" noValidate>
                        <div className="form-group">
                            <label htmlFor="signup-name">Full Name</label>
                            <div className="input-wrapper">
                                <User className="input-icon" size={20} />
                                <input id="signup-name" type="text" placeholder="Enter your name"
                                    value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="signup-email">Email</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={20} />
                                <input id="signup-email" type="email" placeholder="Enter your email"
                                    value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="signup-password">Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" size={20} />
                                <input id="signup-password" type="password" placeholder="At least 6 characters"
                                    value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary login-btn" disabled={loading}>
                            {loading ? 'Creating account…' : <><UserPlus size={18} /> Create Account</>}
                        </button>
                        <p className="auth-switch">
                            Already have an account?{' '}
                            <button type="button" className="link-btn" onClick={() => switchMode('login')}>
                                Log In
                            </button>
                        </p>
                    </form>
                )}

            </div>
        </div>
    );
}
