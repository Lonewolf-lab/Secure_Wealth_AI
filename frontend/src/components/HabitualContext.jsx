import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { 
  Zap, 
  TrendingDown, 
  ShoppingBag, 
  CreditCard, 
  CheckCircle2, 
  Sparkles,
  ArrowUpRight,
  Info,
  XCircle,
  Clock
} from 'lucide-react';
import '../styles/feature-previews.css';
import './HabitualContext.css';

const HabitualContext = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('insights');
  const [appliedRules, setAppliedRules] = useState([]);
  const [dismissedRecs, setDismissedRecs] = useState([]);
  const [snoozedRecs, setSnoozedRecs] = useState([]);
  const [selectedWhyModal, setSelectedWhyModal] = useState(null);

  // Habitual Data Insights with Explainability metrics
  const habitInsights = [
    {
      id: 'rec_1',
      category: t('habitual.weekendSpikeCategory') || 'Spending Cadence',
      title: t('habitual.weekendSpikeTitle') || 'Weekend Dining & Cab Spikes Detected',
      desc: t('habitual.weekendSpikeDesc') || 'You spend 38% more on dining out and cabs between Friday 8 PM and Sunday midnight compared to weekday averages (+₹4,200/mo).',
      impact: '-₹50,400/yr',
      priority: 'high',
      why: 'Triggered because your weekend transactions (Fri-Sun) exceed weekday average transaction density by >35% over the past 60 days.',
      suggestion: t('habitual.weekendSpikeSuggestion') || 'Set a ₹3,000 weekend spending ceiling to save ₹1,200/mo into ELSS.',
      icon: <ShoppingBag size={20} />
    },
    {
      id: 'rec_2',
      category: t('habitual.subscriptionCategory') || 'Subscription Audit',
      title: t('habitual.subscriptionTitle') || '3 Overlapping Streaming Subscriptions',
      desc: t('habitual.subscriptionDesc') || 'Active monthly recurring charges for Netflix (4K), Prime Video, and Hotstar Premium total ₹1,450/mo. Usage logs indicate Hotstar inactive for 60 days.',
      impact: '-₹5,980/yr wasted',
      priority: 'medium',
      why: 'Triggered because 3 recurring merchant debits were detected in the same entertainment category, with 1 merchant showing 0 login interactions for 60+ days.',
      suggestion: t('habitual.subscriptionSuggestion') || 'Pause Hotstar Premium auto-debit to recover ₹5,980 annually.',
      icon: <CreditCard size={20} />
    },
    {
      id: 'rec_3',
      category: t('habitual.salarySavingsCategory') || 'Salary Inflow Trigger',
      title: t('habitual.salarySavingsTitle') || 'Salary Day Savings Opportunity',
      desc: t('habitual.salarySavingsDesc') || 'Your salary credits on the 1st of every month. Currently, 65% of your savings remain liquid in savings account till 25th.',
      impact: '+₹14,200 potential interest',
      priority: 'high',
      why: 'Triggered because salary inflow detected on 1st of month retains a >60% uninvested cash balance for more than 20 consecutive days.',
      suggestion: t('habitual.salarySavingsSuggestion') || 'Enable Auto-Sweep of ₹15,000 on 2nd of every month into Liquid Mutual Funds.',
      icon: <TrendingDown size={20} />
    }
  ];

  // Smart Micro-Rules
  const microRules = [
    {
      id: 'rule1',
      title: t('habitual.rule1Title') || 'Round-Up UPI Micro Savings',
      desc: t('habitual.rule1Desc') || 'Automatically round up every UPI purchase to the nearest ₹50 and invest the spare change in Liquid FD.',
      estMonthly: '₹850/mo saved'
    },
    {
      id: 'rule2',
      title: t('habitual.rule2Title') || 'Salary Day 10% Auto-Transfer',
      desc: t('habitual.rule2Desc') || 'Automatically transfer 10% of monthly salary into High-Yield ELSS on salary credit date.',
      estMonthly: '₹12,500/mo saved'
    },
    {
      id: 'rule3',
      title: t('habitual.rule3Title') || 'Impulse Cooling-Off Lock',
      desc: t('habitual.rule3Desc') || 'Require a 24-hour waiting period for discretionary e-commerce purchases exceeding ₹5,000.',
      estMonthly: '₹3,400/mo saved'
    }
  ];

  const toggleRule = (ruleId) => {
    setAppliedRules(prev => 
      prev.includes(ruleId) ? prev.filter(id => id !== ruleId) : [...prev, ruleId]
    );
  };

  const handleDismiss = (id) => {
    setDismissedRecs(prev => [...prev, id]);
  };

  const handleSnooze = (id) => {
    setSnoozedRecs(prev => [...prev, id]);
  };

  const activeInsights = habitInsights.filter(
    item => !dismissedRecs.includes(item.id) && !snoozedRecs.includes(item.id)
  );

  return (
    <div className="feature-preview--habit habitual-context-card">
      {/* High-Visibility Testing Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="feature-tag--habit">
          <Sparkles size={13} />
          <span>[NEW — HABITUAL CONTEXT]</span>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#00f0ff', fontFamily: 'monospace' }}>
          FEAT-1 ACTIVE • VISUAL TEST MODE
        </span>
      </div>

      {/* Header */}
      <div className="habitual-header">
        <div className="habitual-title-box">
          <div className="habitual-icon-glow">
            <Zap size={22} />
          </div>
          <div>
            <h3>{t('habitual.title') || 'Habitual Context & Behavioral Intelligence'}</h3>
            <p>{t('habitual.subtitle') || 'AI analysis of spending cadence, subscriptions, and automated micro-savings rules'}</p>
          </div>
        </div>

        <div className="habitual-tab-pills">
          <button 
            className={`habitual-tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            {t('habitual.tabInsights') || `Insights (${activeInsights.length})`}
          </button>
          <button 
            className={`habitual-tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            {t('habitual.tabRules') || 'Micro-Rules Engine'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'insights' ? (
        activeInsights.length > 0 ? (
          <div className="habitual-insights-grid">
            {activeInsights.map((insight) => (
              <motion.div 
                key={insight.id}
                className="habit-insight-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="insight-top-bar">
                  <span className="insight-category">{insight.category}</span>
                  <span className="insight-impact-badge">{insight.impact}</span>
                </div>

                <div className="insight-body">
                  <div className="insight-icon-wrapper">
                    {insight.icon}
                  </div>
                  <div>
                    <h4 className="insight-title">{insight.title}</h4>
                    <p className="insight-desc">{insight.desc}</p>
                  </div>
                </div>

                <div className="insight-footer">
                  <div className="insight-suggestion">
                    <Sparkles size={14} className="sparkle-yellow" />
                    <span><strong>AI Action:</strong> {insight.suggestion}</span>
                  </div>

                  <div className="insight-action-row">
                    <button 
                      className="btn-why-me" 
                      onClick={() => setSelectedWhyModal(insight)}
                      title="Why am I seeing this?"
                    >
                      <Info size={13} />
                      <span>Why am I seeing this?</span>
                    </button>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button 
                        className="btn-icon-action" 
                        onClick={() => handleSnooze(insight.id)}
                        title="Snooze 30 Days"
                      >
                        <Clock size={13} />
                      </button>
                      <button 
                        className="btn-icon-action" 
                        onClick={() => handleDismiss(insight.id)}
                        title="Dismiss"
                      >
                        <XCircle size={13} />
                      </button>
                    </div>
                  </div>

                  <button className="btn-apply-habit">
                    <span>{t('habitual.applyAction') || 'Enable Habit Rule'}</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="habitual-empty-state">
            <CheckCircle2 size={32} color="#00f0ff" />
            <h4>All Habitual Recommendations Reviewed</h4>
            <p>Your financial spending cadence is optimal. No active behavioral anomalies detected.</p>
          </div>
        )
      ) : (
        <div className="habitual-rules-container">
          <div className="rules-intro">
            <h4>{t('habitual.rulesTitle') || 'Automated Behavioral Micro-Savings Rules'}</h4>
            <p>{t('habitual.rulesDesc') || 'Activate zero-effort behavioral rules that automatically move money into wealth-building SIPs based on real-world triggers.'}</p>
          </div>

          <div className="rules-grid">
            {microRules.map((rule) => {
              const isEnabled = appliedRules.includes(rule.id);
              return (
                <div key={rule.id} className={`micro-rule-card ${isEnabled ? 'enabled' : ''}`}>
                  <div className="rule-header">
                    <div>
                      <h5 className="rule-title">{rule.title}</h5>
                      <span className="rule-est-badge">{rule.estMonthly}</span>
                    </div>
                    <button 
                      className={`rule-toggle-btn ${isEnabled ? 'on' : 'off'}`}
                      onClick={() => toggleRule(rule.id)}
                    >
                      {isEnabled ? <CheckCircle2 size={18} /> : <div className="toggle-dot-off" />}
                      <span>{isEnabled ? 'ACTIVE' : 'ENABLE'}</span>
                    </button>
                  </div>
                  <p className="rule-desc">{rule.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Why Am I Seeing This Modal */}
      {selectedWhyModal && (
        <div className="why-modal-backdrop" onClick={() => setSelectedWhyModal(null)}>
          <div className="why-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="why-modal-header">
              <Info size={18} color="#00f0ff" />
              <h4>Explainability & Data Grounding</h4>
            </div>
            <p className="why-modal-title"><strong>Recommendation:</strong> {selectedWhyModal.title}</p>
            <p className="why-modal-reason"><strong>Trigger Logic:</strong> {selectedWhyModal.why}</p>
            <div className="why-disclaimer-box">
              <p><em>Disclaimer: This is an informational insight based on your historical transaction data. Consider consulting a certified advisor before making execution changes.</em></p>
            </div>
            <button className="btn-close-why" onClick={() => setSelectedWhyModal(null)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitualContext;
