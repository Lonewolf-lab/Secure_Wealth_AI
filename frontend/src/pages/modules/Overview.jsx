import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldAlert, 
  Award,
  Wallet,
  Target,
  Shield,
  Percent,
  TrendingDown
} from 'lucide-react';
import './Overview.css';

const Overview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const score = wealthScore?.score || 500;
  const savingsScore = wealthScore?.savingsScore || 125;
  const goalScore = wealthScore?.goalScore || 125;
  const investmentScore = wealthScore?.investmentScore || 125;
  const protectionScore = wealthScore?.protectionScore || 125;

  // SVG Gauge math
  const radius = 70;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 1000) * circumference;

  const getScoreRating = (val) => {
    if (val >= 800) return { label: 'EXCELLENT', color: '#00ff88' };
    if (val >= 600) return { label: 'STRONG', color: '#00e5ff' };
    if (val >= 400) return { label: 'MODERATE', color: '#ffb700' };
    return { label: 'WEAK', color: '#ff3366' };
  };

  const rating = getScoreRating(score);

  return (
    <div className="overview-panel-content">
      {/* Upper Grid: Circular Dial & Highlights */}
      <div className="overview-top-grid">
        
        {/* Circular Dial Card */}
        <div className="overview-card score-dial-card">
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
              />
              <circle
                className="gauge-progress"
                cx="90"
                cy="90"
                r={radius}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  stroke: rating.color,
                  filter: `drop-shadow(0 0 8px ${rating.color}44)`
                }}
              />
            </svg>
            <div className="dial-center-text">
              <span className="score-number" style={{ color: rating.color }}>{score}</span>
              <span className="score-max">/ 1000</span>
              <span className="score-rating-label" style={{ backgroundColor: `${rating.color}15`, color: rating.color }}>
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
                <div className="comp-score-bar-fill" style={{ width: `${(savingsScore/250)*100}%`, backgroundColor: '#00ff88' }}></div>
              </div>
            </div>

            <div className="comp-score-item">
              <div className="comp-score-info">
                <span>Goals</span>
                <span className="comp-score-val">{goalScore} / 250</span>
              </div>
              <div className="comp-score-bar-bg">
                <div className="comp-score-bar-fill" style={{ width: `${(goalScore/250)*100}%`, backgroundColor: '#00e5ff' }}></div>
              </div>
            </div>

            <div className="comp-score-item">
              <div className="comp-score-info">
                <span>Investments</span>
                <span className="comp-score-val">{investmentScore} / 250</span>
              </div>
              <div className="comp-score-bar-bg">
                <div className="comp-score-bar-fill" style={{ width: `${(investmentScore/250)*100}%`, backgroundColor: '#ffb700' }}></div>
              </div>
            </div>

            <div className="comp-score-item">
              <div className="comp-score-info">
                <span>Protection</span>
                <span className="comp-score-val">{protectionScore} / 250</span>
              </div>
              <div className="comp-score-bar-bg">
                <div className="comp-score-bar-fill" style={{ width: `${(protectionScore/250)*100}%`, backgroundColor: '#ff3366' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Aggregator Asset Summary Metrics */}
        <div className="overview-stats-container">
          <div className="stats-metric-card">
            <div className="metric-icon-box"><Wallet size={24} /></div>
            <div className="metric-details">
              <span>TOTAL PORTFOLIO NET WORTH</span>
              <h2>₹{totalNetWorth?.toLocaleString('en-IN') || '0'}</h2>
              <p className="metric-trendup">
                <TrendingUp size={14} /> Integrated via PSB Aggregator
              </p>
            </div>
          </div>

          <div className="stats-metric-card">
            <div className="metric-icon-box"><Percent size={24} /></div>
            <div className="metric-details">
              <span>MONTHLY SAVINGS RATE</span>
              <h2>{(monthlySavingsRate * 100).toFixed(1)}%</h2>
              <p className="metric-details-text">
                Targeting ₹{((monthlyIncome || 0) * monthlySavingsRate).toLocaleString('en-IN')}/mo in savings
              </p>
            </div>
          </div>

          <div className="stats-metric-card">
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
          </div>
        </div>

      </div>

      {/* Lower Row: Recent Activity & Market Sentiment */}
      <div className="overview-bottom-grid">
        {/* Transaction History */}
        <div className="overview-card activity-card">
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
        </div>

        {/* Market Bulletins */}
        <div className="overview-card bulletins-card">
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
        </div>
      </div>
    </div>
  );
};

export default Overview;
