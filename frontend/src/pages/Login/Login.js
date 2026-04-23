import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, LogIn, User, Mail, Lock, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../../utils/api';
import './Login.css';

// ─── tiny helpers ────────────────────────────────────────────────────────────
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function Login({ initialMode = 'login' }) {
    // 'login' | 'signup' | 'otp'
    const [mode, setMode] = useState(initialMode);

    // shared fields
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [name, setName]         = useState('');

    // OTP state
    const [otpDigits, setOtpDigits]     = useState(Array(OTP_LENGTH).fill(''));
    const [cooldown, setCooldown]       = useState(0);
    const otpRefs = useRef([]);

    const [error, setError]   = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // ── cooldown timer ────────────────────────────────────────────────────────
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    // ── reset state when switching modes ─────────────────────────────────────
    const switchMode = (next) => {
        setError('');
        setSuccess('');
        setOtpDigits(Array(OTP_LENGTH).fill(''));
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

    // ── signup step 1: send OTP ───────────────────────────────────────────────
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!name || !email || !password) { setError('All fields are required.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true); setError('');
        try {
            const data = await api.sendOtp(email, password, name);
            setCooldown(RESEND_COOLDOWN);
            setOtpDigits(Array(OTP_LENGTH).fill(''));
            setMode('otp');

            if (data.dev_otp) {
                // Dev mode: backend returned the OTP directly — auto-fill and notify
                const digits = data.dev_otp.split('');
                setOtpDigits(digits);
                setSuccess(`Dev mode: email not sent. Your OTP is ${data.dev_otp}`);
            } else {
                setSuccess(`A 6-digit code was sent to ${email}`);
            }

            setTimeout(() => otpRefs.current[OTP_LENGTH - 1]?.focus(), 100);
        } catch (err) {
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── resend OTP ────────────────────────────────────────────────────────────
    const handleResend = async () => {
        if (cooldown > 0) return;
        setLoading(true); setError(''); setSuccess('');
        try {
            const data = await api.sendOtp(email, password, name);
            setCooldown(RESEND_COOLDOWN);
            if (data.dev_otp) {
                const digits = data.dev_otp.split('');
                setOtpDigits(digits);
                setSuccess(`Dev mode: new OTP is ${data.dev_otp}`);
                setTimeout(() => otpRefs.current[OTP_LENGTH - 1]?.focus(), 100);
            } else {
                setOtpDigits(Array(OTP_LENGTH).fill(''));
                setSuccess('A new code was sent.');
                otpRefs.current[0]?.focus();
            }
        } catch (err) {
            setError(err.message || 'Failed to resend OTP.');
        } finally {
            setLoading(false);
        }
    };

    // ── OTP input handling ────────────────────────────────────────────────────
    const handleOtpChange = (index, value) => {
        // accept only digits
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...otpDigits];
        next[index] = digit;
        setOtpDigits(next);
        if (digit && index < OTP_LENGTH - 1) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        const next = Array(OTP_LENGTH).fill('');
        pasted.split('').forEach((d, i) => { next[i] = d; });
        setOtpDigits(next);
        const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
        otpRefs.current[focusIdx]?.focus();
    };

    // ── signup step 2: verify OTP ─────────────────────────────────────────────
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const otp = otpDigits.join('');
        if (otp.length < OTP_LENGTH) { setError('Please enter the full 6-digit code.'); return; }
        setLoading(true); setError('');
        try {
            const data = await api.verifyOtp(email, otp);
            localStorage.setItem('yoga_user', JSON.stringify({
                email: data.user.email,
                name: data.user.name,
                loggedInAt: new Date().toISOString()
            }));
            navigate('/');
        } catch (err) {
            setError(err.message || 'Verification failed. Please try again.');
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
                    {mode === 'otp'    && <><h2>Verify Email</h2><p>Enter the code sent to <strong>{email}</strong></p></>}
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
                    <form onSubmit={handleSendOtp} className="login-form" noValidate>
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
                            {loading ? 'Sending code…' : <><Mail size={18} /> Send Verification Code</>}
                        </button>
                        <p className="auth-switch">
                            Already have an account?{' '}
                            <button type="button" className="link-btn" onClick={() => switchMode('login')}>
                                Log In
                            </button>
                        </p>
                    </form>
                )}

                {/* ══════════════ OTP FORM ══════════════ */}
                {mode === 'otp' && (
                    <form onSubmit={handleVerifyOtp} className="login-form" noValidate>
                        <div className="otp-group">
                            {otpDigits.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => otpRefs.current[i] = el}
                                    className="otp-box"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                    onPaste={i === 0 ? handleOtpPaste : undefined}
                                    aria-label={`OTP digit ${i + 1}`}
                                />
                            ))}
                        </div>

                        <button type="submit" className="btn-primary login-btn" disabled={loading}>
                            {loading ? 'Verifying…' : <><CheckCircle size={18} /> Verify & Create Account</>}
                        </button>

                        <div className="otp-footer">
                            <button
                                type="button"
                                className="link-btn resend-btn"
                                onClick={handleResend}
                                disabled={cooldown > 0 || loading}
                            >
                                <RefreshCw size={14} />
                                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                            </button>
                            <button type="button" className="link-btn" onClick={() => switchMode('signup')}>
                                ← Change details
                            </button>
                        </div>
                    </form>
                )}

            </div>
        </div>
    );
}
