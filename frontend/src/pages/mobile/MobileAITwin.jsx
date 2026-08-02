import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { 
  BrainCircuit, 
  Sparkles, 
  TrendingUp, 
  Sliders, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  HelpCircle
} from 'lucide-react';

const MobileAITwin = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [simulationYear, setSimulationYear] = useState(10);
  const [monthlySip, setMonthlySip] = useState(15000);
  const [rebalanceApplied, setRebalanceApplied] = useState(false);

  // Math calculation for Monte Carlo
  const rate = 0.12;
  const n = simulationYear * 12;
  const expectedP50 = Math.round(monthlySip * ((Math.pow(1 + rate/12, n) - 1) / (rate/12)) * (1 + rate/12));
  const conservativeP10 = Math.round(expectedP50 * 0.78);
  const aggressiveP90 = Math.round(expectedP50 * 1.35);

  const recommendations = [
    {
      id: 1,
      title: 'Tax Optimization (Sec 80C)',
      desc: 'Invest ₹45,000 in PSB Tax Saver ELSS before fiscal year end to claim ₹14,040 tax refund.',
      impact: '+₹14,040 Direct Savings',
      category: 'TAX_SAVER'
    },
    {
      id: 2,
      title: 'Asset Rebalancing Opportunity',
      desc: 'Your cash reserve is 12% above target. Move ₹50,000 into Nifty 50 Index Fund.',
      impact: '+₹38,500 Long-Term Value',
      category: 'REBALANCE'
    }
  ];

  return (
    <div className="mobile-page-content">
      {/* AI Advisor Banner */}
      <motion.div 
        className="mobile-card ai-hero-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="ai-card-header">
          <div className="ai-badge">
            <BrainCircuit size={20} /> AI Wealth Twin
          </div>
          <span className="ai-status-pulse">● Live Inference</span>
        </div>
        <h2>{t('advisor.aiEngine')}</h2>
        <p>{t('advisor.aiSub')}</p>
      </motion.div>

      {/* AI Recommendations */}
      <div className="mobile-section-header">
        <h3>{t('advisor.smartRecs')}</h3>
      </div>

      <div className="recommendations-list">
        {recommendations.map((rec) => (
          <motion.div 
            key={rec.id} 
            className="recommendation-card"
            whileHover={{ scale: 1.01 }}
          >
            <div className="rec-top">
              <span className="rec-tag">{rec.category}</span>
              <span className="rec-impact">{rec.impact}</span>
            </div>
            <h4>{rec.title}</h4>
            <p>{rec.desc}</p>
            <button 
              className="rec-action-btn"
              onClick={() => {
                setRebalanceApplied(true);
                setTimeout(() => setRebalanceApplied(false), 3000);
              }}
            >
              {rebalanceApplied ? <CheckCircle2 size={14} /> : <Zap size={14} />}
              {rebalanceApplied ? t('advisor.recApplied') : t('advisor.applyRec')}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Monte Carlo What-If Simulator */}
      <div className="mobile-section-header">
        <h3>{t('advisor.monteCarlo')}</h3>
      </div>

      <div className="simulator-card">
        <div className="sim-header">
          <Sliders size={18} />
          <span>Project Net Worth Growth</span>
        </div>

        <div className="sim-slider-group">
          <div className="slider-label-row">
            <span>{t('advisor.horizon')}</span>
            <span className="slider-val">{simulationYear} Years</span>
          </div>
          <input 
            type="range" 
            min="5" 
            max="30" 
            step="5" 
            value={simulationYear} 
            onChange={(e) => setSimulationYear(parseInt(e.target.value))}
            className="mobile-range-slider"
          />
          <div className="range-ticks">
            <span>5 Years</span>
            <span>15 Years</span>
            <span>30 Years</span>
          </div>
        </div>

        <div className="sim-slider-group">
          <div className="slider-label-row">
            <span>{t('advisor.monthlySip')}</span>
            <span className="slider-val">₹{monthlySip.toLocaleString('en-IN')}/mo</span>
          </div>
          <input 
            type="range" 
            min="5000" 
            max="100000" 
            step="5000" 
            value={monthlySip} 
            onChange={(e) => setMonthlySip(parseInt(e.target.value))}
            className="mobile-range-slider"
          />
        </div>

        {/* Projection Outputs */}
        <div className="projection-results">
          <div className="proj-box p10">
            <span className="proj-label">{t('advisor.conservative')}</span>
            <span className="proj-amount">₹{(conservativeP10 / 100000).toFixed(1)} Lakhs</span>
          </div>
          <div className="proj-box p50 highlight">
            <span className="proj-label">{t('advisor.expected')}</span>
            <span className="proj-amount">₹{(expectedP50 / 100000).toFixed(1)} Lakhs</span>
          </div>
          <div className="proj-box p90">
            <span className="proj-label">{t('advisor.aggressive')}</span>
            <span className="proj-amount">₹{(aggressiveP90 / 100000).toFixed(1)} Lakhs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAITwin;
