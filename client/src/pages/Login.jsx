import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Loader2, Award, Zap, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await axios.post('/api/auth/login', { email, password });
            const { token, user } = res.data;
            onLogin({ ...user, token });
        } catch (err) {
            console.error('Login failed', err);
            setError(err.response?.data?.error || 'Authentication failure. Check authorization or medical license.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card glass-card fade-in">
                <div className="login-header">
                    <div className="login-logo">N</div>
                    <h1>Nivaro Health</h1>
                    <p>Production-Level Medical Gateway</p>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                        <ShieldCheck size={12} />
                        AES-256 SESSION PROTECTION ACTIVE
                    </div>
                </div>

                {error && (
                    <div className="error-alert" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fee2e2', marginBottom: '1.5rem', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={14} /> {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label><Mail size={16} /> Medical/Business Email</label>
                        <input
                            type="email"
                            placeholder="name@nivaro.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div className="input-group">
                        <label><Lock size={16} /> Encryption Key / Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary login-btn" disabled={loading} style={{ width: '100%', height: '3.5rem', marginTop: '1rem' }}>
                        {loading ? <Loader2 className="spin" /> : 'Log In to Dashboard'}
                    </button>
                </form>

                <div className="login-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Authorized Access Only
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <Loader2 size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Session Monitored
                    </div>
                </div>
            </div>

            <div style={{ position: 'fixed', bottom: '2rem', width: '100%', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
                System ID: <code>PROD-GATE-01-SECURED</code>
            </div>
        </div>
    );
};

export default Login;
