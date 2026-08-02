import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Login.css';

const Login = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  const handleQuickLogin = async (mockEmail) => {
    setError('');
    try {
      await login(mockEmail, 'password123');
      navigate('/dashboard');
    } catch (err) {
      setError('Quick login failed. Verify database seeding.');
    }
  };

  const mockUsers = [
    {
      name: 'Arjun Sharma',
      email: 'arjun.sharma@example.com',
      avatar: 'AS',
      role: 'Growth Portfolio',
      desc: 'Tech Manager, Age 29. High risk tolerance.'
    },
    {
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      avatar: 'PP',
      role: 'Balanced Portfolio',
      desc: 'Consultant, Age 24. Moderate risk tolerance.'
    },
    {
      name: 'Mohammed Ali',
      email: 'mohammed.ali@example.com',
      avatar: 'MA',
      role: 'Conservative Portfolio',
      desc: 'Retiring Professional, Age 55. Low risk tolerance.'
    }
  ];

  return (
    <div className="login-page">
      <div className="login-bg-glow"></div>
      
      <div className="container login-grid">
        {/* Left Side: Mock Quick Login */}
        <div className="login-info-section">
          <div className="section-label">{t('auth.quickAccess')}</div>
          <h2 className="section-title">{t('auth.selectProfile')}</h2>
          <p className="section-subtitle">
            {t('auth.quickSub')}
          </p>

          <div className="quick-login-list">
            {mockUsers.map((u) => (
              <div 
                key={u.email} 
                className="quick-user-card"
                onClick={() => handleQuickLogin(u.email)}
              >
                <div className="quick-avatar">{u.avatar}</div>
                <div className="quick-user-details">
                  <h4>{u.name}</h4>
                  <p className="quick-user-role">{u.role}</p>
                  <p className="quick-user-desc">{u.desc}</p>
                </div>
                <div className="quick-login-hover-arrow">→</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Standard Login Form */}
        <div className="login-form-container">
          <div className="login-glass-card">
            <h3 className="form-title">{t('auth.loginTitle')}</h3>
            <p className="form-subtitle">{t('auth.loginSub')}</p>

            {error && <div className="login-error-message">{error}</div>}

            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">{t('auth.emailLabel')}</label>
                <input 
                  type="email" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">{t('auth.passwordLabel')}</label>
                <input 
                  type="password" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary login-submit-btn" 
                disabled={loading}
              >
                {loading ? t('auth.securing') : t('auth.loginBtn')}
              </button>
            </form>

            <div className="form-switch-link" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {t('auth.newClient')} <Link to="/register" style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{t('auth.createAccount')}</Link>
            </div>

            <div className="form-disclaimer">
              Protected by multi-factor deterministic biometrics & behavioral anomaly scores.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
