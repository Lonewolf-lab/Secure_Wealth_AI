import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Register.css';

const Register = () => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(name, email, password, phone);
      navigate('/dashboard');
    } catch (err) {
      setError('Registration failed. Email might already be registered.');
    }
  };

  return (
    <div className="register-page">
      <div className="register-bg-glow"></div>
      
      <div className="container register-grid">
        {/* Left Side: Brand Value Prop */}
        <div className="register-info-section">
          <div className="section-label">JOIN SECUREWEALTH AI</div>
          <h2 className="section-title">{t('auth.regTitle')}</h2>
          <p className="section-subtitle">
            {t('auth.regSub')}
          </p>

          <div className="value-props-list">
            <div className="value-prop-item">
              <div className="prop-bullet">✓</div>
              <div className="prop-text">
                <strong>{t('dashboard.circularScore')}</strong>
                <p>{t('dashboard.healthTwin')}</p>
              </div>
            </div>

            <div className="value-prop-item">
              <div className="prop-bullet">✓</div>
              <div className="prop-text">
                <strong>{t('advisor.mptTitle')}</strong>
                <p>{t('advisor.targetAllocation')}</p>
              </div>
            </div>

            <div className="value-prop-item">
              <div className="prop-bullet">✓</div>
              <div className="prop-text">
                <strong>{t('security.wprsTitle')}</strong>
                <p>{t('auth.disclaimer')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="register-form-container">
          <div className="register-glass-card">
            <h3 className="form-title">{t('auth.regTitle')}</h3>
            <p className="form-subtitle">{t('auth.regSub')}</p>

            {error && <div className="register-error-message">{error}</div>}

            <form onSubmit={handleRegisterSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="name">{t('auth.fullNameLabel')}</label>
                <input 
                  type="text" 
                  id="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arjun Sharma"
                  required 
                />
              </div>

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
                <label htmlFor="phone">{t('auth.phoneLabel')}</label>
                <input 
                  type="tel" 
                  id="phone" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
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
                className="btn btn-primary register-submit-btn" 
                disabled={loading}
              >
                {loading ? t('common.loading') : t('auth.regBtn')}
              </button>
            </form>

            <div className="form-switch-link">
              {t('auth.alreadyClient')} <Link to="/login">{t('nav.signin')}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
