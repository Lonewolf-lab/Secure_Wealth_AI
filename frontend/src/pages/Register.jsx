import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const Register = () => {
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
          <h2 className="section-title">Establish Your Wealth Twin</h2>
          <p className="section-subtitle">
            Create an account to start tracking your net worth, set targets, configure AI optimization strategies, and secure your transactions.
          </p>

          <div className="value-props-list">
            <div className="value-prop-item">
              <div className="prop-bullet">✓</div>
              <div className="prop-text">
                <strong>Circular Wealth Scoring</strong>
                <p>Gamified overview analyzing your saving rate, goals, and security profiles.</p>
              </div>
            </div>

            <div className="value-prop-item">
              <div className="prop-bullet">✓</div>
              <div className="prop-text">
                <strong>Mean-Variance MPT Optimizer</strong>
                <p>Mathematically optimal asset rebalancing adapted to your risk tolerance.</p>
              </div>
            </div>

            <div className="value-prop-item">
              <div className="prop-bullet">✓</div>
              <div className="prop-text">
                <strong>Real-Time Security Twin</strong>
                <p>Deterministic behavioral guards verifying every protected transaction.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="register-form-container">
          <div className="register-glass-card">
            <h3 className="form-title">Client Registration</h3>
            <p className="form-subtitle">Create your secure portfolio and link aggregator metrics</p>

            {error && <div className="register-error-message">{error}</div>}

            <form onSubmit={handleRegisterSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="name">FULL LEGAL NAME</label>
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
                <label htmlFor="email">EMAIL ADDRESS</label>
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
                <label htmlFor="phone">MOBILE PHONE NUMBER</label>
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
                <label htmlFor="password">PORTAL PASSWORD</label>
                <input 
                  type="password" 
                  id="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary register-submit-btn" 
                disabled={loading}
              >
                {loading ? 'INITIALIZING PORTFOLIO...' : 'CREATE ACCOUNT'}
              </button>
            </form>

            <div className="form-switch-link">
              Already registered? <Link to="/login">Sign In here</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
