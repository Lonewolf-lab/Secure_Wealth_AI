import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Target, 
  TrendingUp, 
  Plus, 
  PieChart, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Calendar,
  Sparkles
} from 'lucide-react';

const MobilePortfolio = () => {
  const [activeTab, setActiveTab] = useState('investments');
  const [selectedAsset, setSelectedAsset] = useState(null);

  const mockInvestments = [
    { id: 1, name: 'PSB Dynamic Equity Fund', type: 'ELSS', amount: 450000, returns: '+18.4%', gain: 70000, risk: 'Moderate' },
    { id: 2, name: 'Punjab & Sind Tax Saver FD', type: 'FD', amount: 600000, returns: '+7.2%', gain: 43200, risk: 'Low (Guaranteed)' },
    { id: 3, name: 'Sovereign Gold Bond 2026', type: 'GOLD', amount: 350000, returns: '+24.1%', gain: 68000, risk: 'Low' },
    { id: 4, name: 'Nifty 50 Index SIP', type: 'SIP', amount: 280000, returns: '+15.8%', gain: 38200, risk: 'Moderate' },
  ];

  const mockGoals = [
    { id: 1, title: 'Dream Home Down Payment', target: 2500000, saved: 1850000, deadline: 'Dec 2026', category: 'HOME' },
    { id: 2, title: 'Child Higher Education Fund', target: 5000000, saved: 2100000, deadline: '2032', category: 'EDUCATION' },
    { id: 3, title: 'Retirement Wealth Corpus', target: 20000000, saved: 6400000, deadline: '2045', category: 'RETIREMENT' },
  ];

  return (
    <div className="mobile-page-content">
      {/* Portfolio Header Switcher */}
      <div className="mobile-tab-bar">
        <button 
          className={`tab-pill ${activeTab === 'investments' ? 'active' : ''}`}
          onClick={() => setActiveTab('investments')}
        >
          <Wallet size={16} /> Holdings ({mockInvestments.length})
        </button>
        <button 
          className={`tab-pill ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          <Target size={16} /> Goals ({mockGoals.length})
        </button>
      </div>

      {activeTab === 'investments' ? (
        <>
          {/* Holdings Summary Box */}
          <motion.div 
            className="mobile-card highlight-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="card-top-row">
              <span className="card-subtitle">TOTAL INVESTED VALUE</span>
              <span className="gain-badge">+₹2,19,400 Total Returns</span>
            </div>
            <h2 className="total-holding-amount">₹16,80,000</h2>
            <div className="holding-breakdown-bar">
              <div className="bar-segment seg-1" style={{ width: '40%' }}></div>
              <div className="bar-segment seg-2" style={{ width: '30%' }}></div>
              <div className="bar-segment seg-3" style={{ width: '20%' }}></div>
              <div className="bar-segment seg-4" style={{ width: '10%' }}></div>
            </div>
          </motion.div>

          {/* Investment List */}
          <div className="mobile-section-header">
            <h3>Active Holdings</h3>
            <button className="add-mini-btn">
              <Plus size={14} /> Add Asset
            </button>
          </div>

          <div className="holdings-list">
            {mockInvestments.map((inv) => (
              <motion.div 
                key={inv.id} 
                className="holding-card"
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAsset(inv)}
              >
                <div className="holding-card-top">
                  <div className="holding-icon-wrapper">
                    <PieChart size={18} />
                  </div>
                  <div className="holding-info">
                    <h4>{inv.name}</h4>
                    <span className="holding-type">{inv.type} • {inv.risk} Risk</span>
                  </div>
                  <div className="holding-val-col">
                    <span className="holding-value">₹{inv.amount.toLocaleString('en-IN')}</span>
                    <span className="holding-return positive">{inv.returns}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Goals Tracker */}
          <div className="mobile-section-header">
            <h3>Milestone Goals</h3>
            <button className="add-mini-btn">
              <Plus size={14} /> New Goal
            </button>
          </div>

          <div className="goals-list">
            {mockGoals.map((goal) => {
              const progressPct = Math.min(100, Math.round((goal.saved / goal.target) * 100));
              return (
                <motion.div 
                  key={goal.id} 
                  className="goal-mobile-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="goal-card-header">
                    <div className="goal-title-group">
                      <h4>{goal.title}</h4>
                      <span className="goal-deadline"><Calendar size={12} /> Target: {goal.deadline}</span>
                    </div>
                    <div className="goal-pct-pill">{progressPct}%</div>
                  </div>

                  <div className="goal-progress-container">
                    <div className="goal-progress-bar" style={{ width: `${progressPct}%` }}></div>
                  </div>

                  <div className="goal-card-footer">
                    <span className="saved-text">Saved: <strong>₹{goal.saved.toLocaleString('en-IN')}</strong></span>
                    <span className="target-text">Target: ₹{goal.target.toLocaleString('en-IN')}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Asset Detail Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <div className="mobile-modal-overlay" onClick={() => setSelectedAsset(null)}>
            <motion.div 
              className="mobile-modal-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-handle"></div>
              <h3>{selectedAsset.name}</h3>
              <p className="modal-sub">{selectedAsset.type} Portfolio Holding</p>

              <div className="asset-detail-grid">
                <div className="detail-box">
                  <span className="lbl">Current Value</span>
                  <span className="val">₹{selectedAsset.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="detail-box">
                  <span className="lbl">Overall Returns</span>
                  <span className="val positive">{selectedAsset.returns} (+₹{selectedAsset.gain.toLocaleString('en-IN')})</span>
                </div>
                <div className="detail-box">
                  <span className="lbl">Risk Rating</span>
                  <span className="val">{selectedAsset.risk}</span>
                </div>
                <div className="detail-box">
                  <span className="lbl">WPRS Security</span>
                  <span className="val safe">Verified Token</span>
                </div>
              </div>

              <div className="modal-btn-row">
                <button className="mobile-btn-cancel" onClick={() => setSelectedAsset(null)}>
                  Close
                </button>
                <button className="mobile-btn-confirm" onClick={() => setSelectedAsset(null)}>
                  Top-up SIP
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobilePortfolio;
