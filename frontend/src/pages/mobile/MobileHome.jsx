import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Zap, 
  Plus, 
  Send, 
  BrainCircuit, 
  ShieldAlert, 
  Eye, 
  EyeOff,
  CheckCircle2,
  Lock,
  ChevronRight
} from 'lucide-react';

const MobileHome = ({ onNavigate, onTriggerFraud, onTriggerOTP }) => {
  const { t } = useLanguage();
  const [showBalance, setShowBalance] = useState(true);
  const [selectedQuickAction, setSelectedQuickAction] = useState(null);
  const [investAmount, setInvestAmount] = useState('25000');
  const [investSuccess, setInvestSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mockNetWorth = 2485000;
  const mockMonthlyGain = '+₹42,800 (+1.75%)';

  const quickActions = [
    { id: 'invest', label: t('home.investNow'), icon: <Plus size={20} />, color: '#00ff88' },
    { id: 'transfer', label: t('home.upiSend'), icon: <Send size={20} />, color: '#3b82f6' },
    { id: 'ai', label: t('home.aiAdvice'), icon: <BrainCircuit size={20} />, color: '#a855f7' },
    { id: 'security', label: t('home.wprsScan'), icon: <ShieldAlert size={20} />, color: '#ffb703' },
  ];

  const recentTransactions = [
    { id: 1, title: 'HDFC Bluechip SIP', category: 'Investment', amount: '-₹10,000', date: 'Today, 10:30 AM', status: 'SAFE', wprsScore: 12 },
    { id: 2, title: 'Salary Credit - PSB Bank', category: 'Income', amount: '+₹1,85,000', date: 'Yesterday', status: 'VERIFIED', wprsScore: 5 },
    { id: 3, title: 'Gold ETF Purchase', category: 'Investment', amount: '-₹15,000', date: 'Jul 28', status: 'SAFE', wprsScore: 18 },
    { id: 4, title: 'Flagged Foreign Wire (Blocked)', category: 'Security Alert', amount: '₹2,50,000', date: 'Jul 25', status: 'BLOCKED', wprsScore: 88 },
  ];

  const handleQuickAction = (actionId) => {
    if (actionId === 'ai') {
      onNavigate('advisor');
    } else if (actionId === 'security') {
      onNavigate('security');
    } else {
      setSelectedQuickAction(actionId);
    }
  };

  const handleExecuteInvest = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (parseInt(investAmount) > 100000) {
        // Trigger WPRS fraud warning demo
        setSelectedQuickAction(null);
        onTriggerFraud();
      } else {
        setInvestSuccess(true);
        setTimeout(() => {
          setInvestSuccess(false);
          setSelectedQuickAction(null);
        }, 1800);
      }
    }, 1000);
  };

  return (
    <div className="mobile-page-content">
      {/* Net Worth Card */}
      <motion.div 
        className="mobile-networth-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="networth-header">
          <div className="networth-title-group">
            <span className="networth-label">{t('home.netWorthLabel')}</span>
            <button className="eye-btn" onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          <div className="security-badge-pill">
            <ShieldCheck size={14} /> {t('home.wprsActive')} (12)
          </div>
        </div>

        <div className="networth-amount">
          {showBalance ? (
            <h2>₹{mockNetWorth.toLocaleString('en-IN')}</h2>
          ) : (
            <h2>₹ ••••••••</h2>
          )}
        </div>

        <div className="networth-growth">
          <span className="growth-pill positive">
            <TrendingUp size={14} /> {mockMonthlyGain}
          </span>
          <span className="growth-subtext">{t('home.vsLastMonth')}</span>
        </div>

        {/* Dynamic Asset Pills */}
        <div className="asset-mini-pills">
          <div className="mini-pill">
            <span className="dot dot-stocks"></span> Stocks 42%
          </div>
          <div className="mini-pill">
            <span className="dot dot-fd"></span> FDs 28%
          </div>
          <div className="mini-pill">
            <span className="dot dot-gold"></span> Gold 18%
          </div>
          <div className="mini-pill">
            <span className="dot dot-cash"></span> Cash 12%
          </div>
        </div>
      </motion.div>

      {/* Quick Action Grid */}
      <div className="quick-actions-grid">
        {quickActions.map((act) => (
          <motion.button 
            key={act.id} 
            className="action-card"
            whileTap={{ scale: 0.95 }}
            onClick={() => handleQuickAction(act.id)}
          >
            <div className="action-icon" style={{ color: act.color, backgroundColor: `${act.color}15` }}>
              {act.icon}
            </div>
            <span className="action-label">{act.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Hackathon Twin Security Spotlight Card */}
      <motion.div 
        className="mobile-feature-banner"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="feature-banner-icon">
          <Zap size={22} className="pulse-icon" />
        </div>
        <div className="feature-banner-content">
          <h4>{t('home.psbGuardTitle')}</h4>
          <p>{t('home.psbGuardDesc')}</p>
          <div className="banner-action-row">
            <button className="banner-btn" onClick={onTriggerOTP}>
              <Lock size={12} /> {t('home.testStepUp')}
            </button>
            <button className="banner-btn danger" onClick={onTriggerFraud}>
              <ShieldAlert size={12} /> {t('home.simulateFraud')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity Feed */}
      <div className="mobile-section-header">
        <h3>{t('home.recentActivity')}</h3>
        <button className="see-all-btn" onClick={() => onNavigate('portfolio')}>
          {t('home.viewAll')} <ChevronRight size={16} />
        </button>
      </div>

      <div className="activity-list">
        {recentTransactions.map((tx) => (
          <div key={tx.id} className="activity-item">
            <div className={`activity-icon-box ${tx.status.toLowerCase()}`}>
              {tx.amount.startsWith('+') ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
            </div>
            <div className="activity-details">
              <span className="activity-title">{tx.title}</span>
              <span className="activity-sub">{tx.date} • {tx.category}</span>
            </div>
            <div className="activity-amount-col">
              <span className={`activity-amount ${tx.amount.startsWith('+') ? 'positive' : tx.status === 'BLOCKED' ? 'blocked' : ''}`}>
                {tx.amount}
              </span>
              <span className={`wprs-tag ${tx.status.toLowerCase()}`}>
                {tx.status === 'BLOCKED' ? 'Blocked (88)' : `WPRS ${tx.wprsScore}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Modal (Invest) */}
      <AnimatePresence>
        {selectedQuickAction === 'invest' && (
          <div className="mobile-modal-overlay" onClick={() => setSelectedQuickAction(null)}>
            <motion.div 
              className="mobile-modal-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-handle"></div>
              <h3>{t('home.executeInvest')}</h3>
              <p className="modal-sub">{t('home.psbGuardDesc')}</p>

              {investSuccess ? (
                <div className="modal-success-box">
                  <CheckCircle2 size={48} color="#00ff88" />
                  <h4>{t('home.investSuccess')}</h4>
                  <p>Added ₹{parseInt(investAmount).toLocaleString('en-IN')} to PSB Mutual Growth Fund.</p>
                </div>
              ) : (
                <>
                  <div className="invest-input-group">
                    <label>{t('common.target')}</label>
                    <div className="amount-input-wrapper">
                      <span>₹</span>
                      <input 
                        type="number" 
                        value={investAmount} 
                        onChange={(e) => setInvestAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="quick-presets">
                    <button onClick={() => setInvestAmount('5000')}>₹5,000</button>
                    <button onClick={() => setInvestAmount('25000')}>₹25,000</button>
                    <button onClick={() => setInvestAmount('150000')}>₹1.5L</button>
                  </div>

                  <div className="wprs-preview-note">
                    <ShieldCheck size={16} /> 
                    <span>WPRS Rating: {parseInt(investAmount) > 100000 ? '⚠️ High Risk (Score > 60)' : '🟢 Safe (Score < 20)'}</span>
                  </div>

                  <div className="modal-btn-row">
                    <button className="mobile-btn-cancel" onClick={() => setSelectedQuickAction(null)}>
                      {t('common.cancel')}
                    </button>
                    <button className="mobile-btn-confirm" onClick={handleExecuteInvest} disabled={isProcessing}>
                      {isProcessing ? t('common.loading') : t('home.confirmInvest')}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileHome;
