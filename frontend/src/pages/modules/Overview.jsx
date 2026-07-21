import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import CountUp from '../../components/CountUp';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldAlert, 
  Award,
  Wallet,
  Target,
  Shield,
  Percent
} from 'lucide-react';
import './Overview.css';

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const cardItemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } 
  },
};

const Overview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/dashboard/summary');
        setData(res);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard summary', err);
        setError('Unable to fetch dashboard summary. Verify the backend connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const score = data?.wealthScore?.score || 524;

  // Single synchronized frame loop for both circle arc and score text
  useEffect(() => {
    if (loading || !data) return;
    
    let start = null;
    const duration = 1200; // ms
    const target = score;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const easeOut = progress * (2 - progress);
      setAnimatedScore(easeOut * target);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [loading, data, score]);

  if (loading) {
    return (
      <div className="overview-loading">
        <div className="skeleton-dial-container">
          <div className="skeleton-dial"></div>
          <div className="skeleton-line short"></div>
        </div>
        <div className="skeleton-grid">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overview-error">
        <ShieldAlert size={48} className="error-icon" />
        <h3>Data Access Offline</h3>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => window.location.reload()}>
          RETRY CONNECTION
        </button>
      </div>
    );
  }

  const { totalNetWorth, monthlyIncome, monthlySavingsRate, topGoal, wealthScore, recentTransactions, marketAlerts } = data || {};

  const savingsScore = wealthScore?.savingsScore || 125;
  const goalScore = wealthScore?.goalScore || 59;
  const investmentScore = wealthScore?.investmentScore || 90;
  const protectionScore = wealthScore?.protectionScore || 250;

  // SVG Gauge math
  const radius = 70;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const currentDashoffset = circumference - (animatedScore / 1000) * circumference;

  const getScoreRating = (val) => {
    if (val >= 800) return { label: 'EXCELLENT', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    if (val >= 600) return { label: 'STRONG', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' };
    if (val >= 400) return { label: 'MODERATE', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    return { label: 'WEAK', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
  };

  const rating = getScoreRating(score);

  return (
    <motion.div 
      className="overview-panel-content"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Upper Grid: Circular Dial & Highlights */}
      <div className="overview-top-grid">
        
        {/* Circular Dial Card */}
        <motion.div 
          className="overview-card score-dial-card" 
          variants={cardItemVariants}
        >
          <div className="card-header">
            <h3>Circular Wealth Score</h3>
            <span className="card-badge"><Award size={14} /> AI Health Twin</span>
          </div>

          <div className="dial-container">
            <svg className="radial-gauge" width="180" height="180" viewBox="0 0 180 180">
              <circle
                className="gauge-track"
                cx="90"
                cy="90"
                r={radius}
                strokeWidth={strokeWidth}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.1)"
              />
              <circle
                className="gauge-progress"
                cx="90"
                cy="90"
                r={radius}
                strokeWidth={strokeWidth}
                fill="transparent"
                stroke={rating.color}
                strokeDasharray={circumference}
                strokeDashoffset={currentDashoffset}
                style={{
                  strokeLinecap: 'round',
                }}
              />
            </svg>
            <div className="dial-center-text">
              <span className="score-number" style={{ color: rating.color }}>
                {Math.round(animatedScore)}
              </span>
              <span className="score-max">/ 1000</span>
              <span className="score-rating-label" style={{ backgroundColor: rating.bg, color: rating.color }}>
                {rating.label}
              </span>
            </div>
          </div>

          <div className="component-scores-grid">
            <div className="comp-score-item">
              <div className="comp-score-info">
                <span>Savings</span>
                <span className="comp-score-val">{savingsScore} / 250</span>
              </div>
              <div className="comp-score-bar-bg">
                <motion.div 
                  className="comp-score-bar-fill" 
                  initial={{ width: '0%' }}
                  animate={{ width: `${(savingsScore/250)*100}%` }}
                  transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                  style={{ backgroundColor: '#10b981' }}
                />
              </div>
            </div>

            <div className="comp-score-item">
              <div className="comp-score-info">
                <span>Goals</span>
                <span className="comp-score-val">{goalScore} / 250</span>
              </div>
              <div className="comp-score-bar-bg">
                <motion.div 
                  className="comp-score-bar-fill" 
                  initial={{ width: '0%' }}
                  animate={{ width: `${(goalScore/250)*100}%` }}
                  transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                  style={{ backgroundColor: '#06b6d4' }}
                />
              </div>
            </div>

            <div className="comp-score-item">
              <div className="comp-score-info">
                <span>Investments</span>
                <span className="comp-score-val">{investmentScore} / 250</span>
              </div>
              <div className="comp-score-bar-bg">
                <motion.div 
                  className="comp-score-bar-fill" 
                  initial={{ width: '0%' }}
                  animate={{ width: `${(investmentScore/250)*100}%` }}
                  transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                  style={{ backgroundColor: '#f59e0b' }}
                />
              </div>
            </div>

            <div className="comp-score-item">
              <div className="comp-score-info">
                <span>Protection</span>
                <span className="comp-score-val">{protectionScore} / 250</span>
              </div>
              <div className="comp-score-bar-bg">
                <motion.div 
                  className="comp-score-bar-fill" 
                  initial={{ width: '0%' }}
                  animate={{ width: `${(protectionScore/250)*100}%` }}
                  transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                  style={{ backgroundColor: '#3b82f6' }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Aggregator Asset Summary Metrics */}
        <div className="overview-stats-container">
          <motion.div 
            className="stats-metric-card" 
            variants={cardItemVariants}
          >
            <div className="metric-icon-box"><Wallet size={24} /></div>
            <div className="metric-details">
              <span>TOTAL PORTFOLIO NET WORTH</span>
              <h2>
                <CountUp end={totalNetWorth || 0} prefix="₹" duration={1200} />
              </h2>
              <p className="metric-trendup">
                <TrendingUp size={14} /> Integrated via PSB Aggregator
              </p>
            </div>
          </motion.div>

          <motion.div 
            className="stats-metric-card" 
            variants={cardItemVariants}
          >
            <div className="metric-icon-box"><Percent size={24} /></div>
            <div className="metric-details">
              <span>MONTHLY SAVINGS RATE</span>
              <h2>
                <CountUp end={monthlySavingsRate ? monthlySavingsRate * 100 : 0} decimals={1} suffix="%" duration={1000} />
              </h2>
              <p className="metric-details-text">
                Targeting ₹{((monthlyIncome || 0) * monthlySavingsRate).toLocaleString('en-IN')}/mo in savings
              </p>
            </div>
          </motion.div>

          <motion.div 
            className="stats-metric-card" 
            variants={cardItemVariants}
          >
            <div className="metric-icon-box"><Target size={24} /></div>
            <div className="metric-details">
              <span>NEAREST FINANCIAL GOAL</span>
              {topGoal ? (
                <>
                  <h2>{topGoal.name}</h2>
                  <p className="metric-goal-sub">
                    Target: ₹{topGoal.targetAmount?.toLocaleString('en-IN')} (Saved: {((topGoal.currentSaved/topGoal.targetAmount)*100).toFixed(0)}%)
                  </p>
                </>
              ) : (
                <>
                  <h2>No Active Goals</h2>
                  <p className="metric-goal-sub">Configure a goal milestone to begin tracking</p>
                </>
              )}
            </div>
          </motion.div>
        </div>

      </div>

      {/* Lower Row: Recent Activity & Market Sentiment */}
      <div className="overview-bottom-grid">
        {/* Transaction History */}
        <motion.div 
          className="overview-card activity-card" 
          variants={cardItemVariants}
        >
          <div className="card-header">
            <h3>Recent Account Transactions</h3>
          </div>
          <div className="transactions-list-box">
            {recentTransactions && recentTransactions.length > 0 ? (
              <div className="tx-list">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="tx-item">
                    <div className={`tx-icon ${tx.type === 'CREDIT' ? 'credit' : 'debit'}`}>
                      {tx.type === 'CREDIT' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </div>
                    <div className="tx-details">
                      <span className="tx-desc">{tx.description}</span>
                      <span className="tx-meta">{tx.category} • {tx.channel}</span>
                    </div>
                    <div className="tx-amount-box">
                      <span className={`tx-amount ${tx.type === 'CREDIT' ? 'credit-text' : 'debit-text'}`}>
                        {tx.type === 'CREDIT' ? '+' : '-'} ₹{tx.amount?.toLocaleString('en-IN')}
                      </span>
                      <span className="tx-date">{new Date(tx.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-msg">No transactions found.</p>
            )}
          </div>
        </motion.div>

        {/* Market Bulletins */}
        <motion.div 
          className="overview-card bulletins-card" 
          variants={cardItemVariants}
        >
          <div className="card-header">
            <h3>SecureWealth Intelligence</h3>
          </div>
          <div className="bulletins-container">
            {marketAlerts && marketAlerts.length > 0 ? (
              <ul className="bulletins-list">
                {marketAlerts.map((alert, idx) => (
                  <li key={idx} className="bulletin-item">
                    <div className="bulletin-dot"></div>
                    <p>{alert}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-bulletins">
                <Shield size={24} className="shield-ok" />
                <p>Security twin verified. All transaction parameters fall within expected standard deviations.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Overview;
