import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { 
  Calculator, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  TrendingUp, 
  Check, 
  AlertCircle,
  ChevronRight,
  Info
} from 'lucide-react';
import '../styles/feature-previews.css';
import './TaxSavingsHub.css';

const TaxSavingsHub = () => {
  const { t } = useLanguage();
  const [selectedRegime, setSelectedRegime] = useState('new');
  const [grossIncome, setGrossIncome] = useState(1800000);
  const [invested80C, setInvested80C] = useState(105000);
  const [selectedInvestModal, setSelectedInvestModal] = useState(null);
  const [investAmount, setInvestAmount] = useState('45000');
  const [investSuccess, setInvestSuccess] = useState(false);

  // Tax Option Instruments Catalogue
  const taxOptions = [
    {
      id: 'elss',
      category: 'Section 80C',
      title: 'PSB ELSS Wealth Tax Saver Fund',
      desc: 'High-growth equity mutual fund with shortest lock-in period among all tax-saving options. Tax deduction up to ₹1,50,000.',
      lockIn: '3 Years (Shortest)',
      expectedReturn: '14.2% p.a.',
      maxLimit: '₹1,50,000',
      taxSaved: 'Up to ₹46,800/yr',
      risk: 'Moderate-High',
      suggestedInvest: Math.max(0, 150000 - invested80C)
    },
    {
      id: 'nps',
      category: 'Section 80CCD(1B)',
      title: 'National Pension System (NPS Tier-I)',
      desc: 'Exclusive additional tax deduction up to ₹50,000 over and above the ₹1.5L 80C limit. Market-linked retirement builder.',
      lockIn: 'Till Age 60',
      expectedReturn: '10.5% p.a.',
      maxLimit: '₹50,000',
      taxSaved: 'Up to ₹15,600/yr',
      risk: 'Moderate',
      suggestedInvest: 50000
    },
    {
      id: 'ppf',
      category: 'Section 80C',
      title: 'Public Provident Fund (PPF)',
      desc: 'Sovereign government-backed tax-free interest builder with EEE (Exempt-Exempt-Exempt) tax status.',
      lockIn: '15 Years',
      expectedReturn: '7.1% p.a. (Tax Free)',
      maxLimit: '₹1,50,000',
      taxSaved: 'Up to ₹46,800/yr',
      risk: 'Guaranteed (Zero Risk)',
      suggestedInvest: 25000
    },
    {
      id: 'health',
      category: 'Section 80D',
      title: 'PSB Complete Health Shield Insurance',
      desc: 'Medical insurance tax deduction for self, family, and senior citizen parents up to ₹75,000/yr.',
      lockIn: '1 Year Renewal',
      expectedReturn: 'Protection + Tax Exemption',
      maxLimit: '₹75,000',
      taxSaved: 'Up to ₹23,400/yr',
      risk: 'Pure Protection',
      suggestedInvest: 25000
    }
  ];

  // Old vs New Tax Calculations
  const calculateOldTax = (income, deductions80c) => {
    const stdDeduction = 50000;
    const taxable = Math.max(0, income - stdDeduction - deductions80c);
    let tax = 0;

    if (taxable <= 250000) tax = 0;
    else if (taxable <= 500000) tax = (taxable - 250000) * 0.05;
    else if (taxable <= 1000000) tax = 1250 + (taxable - 500000) * 0.20;
    else tax = 112500 + (taxable - 1000000) * 0.30;

    return Math.round(tax * 1.04);
  };

  const calculateNewTax = (income) => {
    const stdDeduction = 75000;
    const taxable = Math.max(0, income - stdDeduction);
    let tax = 0;

    if (taxable <= 400000) tax = 0;
    else if (taxable <= 800000) tax = (taxable - 400000) * 0.05;
    else if (taxable <= 1200000) tax = 20000 + (taxable - 800000) * 0.10;
    else if (taxable <= 1600000) tax = 60000 + (taxable - 1200000) * 0.15;
    else if (taxable <= 2400000) tax = 120000 + (taxable - 1600000) * 0.20;
    else tax = 280000 + (taxable - 2400000) * 0.30;

    return Math.round(tax * 1.04);
  };

  const oldTax = calculateOldTax(grossIncome, invested80C);
  const newTax = calculateNewTax(grossIncome);
  const taxDifference = Math.abs(oldTax - newTax);
  const bestRegime = oldTax < newTax ? 'old' : 'new';

  const handleExecuteTaxInvest = () => {
    setInvestSuccess(true);
    setTimeout(() => {
      setInvested80C(prev => Math.min(150000, prev + parseFloat(investAmount || 0)));
      setSelectedInvestModal(null);
      setInvestSuccess(false);
    }, 1500);
  };

  return (
    <div className="feature-preview--tax tax-savings-hub-card">
      {/* High-Visibility Testing Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="feature-tag--tax">
          <Sparkles size={13} />
          <span>[NEW — TAX SAVINGS]</span>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#ff6600', fontFamily: 'monospace' }}>
          FEAT-2 ACTIVE • VISUAL TEST MODE
        </span>
      </div>

      {/* Header */}
      <div className="tax-hub-header">
        <div className="tax-title-box">
          <div className="tax-icon-glow">
            <Calculator size={22} />
          </div>
          <div>
            <h3>{t('tax.title') || 'Tax Savings Options & Regime Solver'}</h3>
            <p>{t('tax.subtitle') || 'Explore 80C, 80CCD, and 80D tax-saving opportunities tailored to your gross income'}</p>
          </div>
        </div>

        <div className="tax-headroom-badge">
          <span>80C Headroom: </span>
          <strong>₹{(150000 - invested80C).toLocaleString()}</strong> remaining
        </div>
      </div>

      {/* Gross Income & Regime Comparison Bar */}
      <div className="tax-calculator-bar">
        <div className="income-slider-group">
          <label>Gross Annual Income: <strong>₹{grossIncome.toLocaleString()}</strong></label>
          <input 
            type="range" 
            min="600000" 
            max="4000000" 
            step="50000"
            value={grossIncome}
            onChange={(e) => setGrossIncome(parseFloat(e.target.value))}
          />
        </div>

        <div className="regime-comparison-matrix">
          <div className={`regime-box ${bestRegime === 'old' ? 'recommended' : ''}`}>
            <span className="regime-label">Old Regime (with deductions)</span>
            <span className="regime-tax-val">₹{oldTax.toLocaleString()}</span>
            {bestRegime === 'old' && <span className="best-tag">RECOMMENDED</span>}
          </div>

          <div className={`regime-box ${bestRegime === 'new' ? 'recommended' : ''}`}>
            <span className="regime-label">New Regime (Standard ₹75k)</span>
            <span className="regime-tax-val">₹{newTax.toLocaleString()}</span>
            {bestRegime === 'new' && <span className="best-tag">RECOMMENDED</span>}
          </div>
        </div>
      </div>

      {/* Tax Instrument Cards Grid */}
      <div className="tax-options-grid">
        {taxOptions.map((opt) => (
          <div key={opt.id} className="tax-option-card">
            <div className="tax-card-top">
              <span className="tax-cat-badge">{opt.category}</span>
              <span className="tax-saved-badge">{opt.taxSaved}</span>
            </div>

            <h4 className="tax-card-title">{opt.title}</h4>
            <p className="tax-card-desc">{opt.desc}</p>

            <div className="tax-metrics-row">
              <div>
                <span className="metric-lbl">Lock-in Period</span>
                <span className="metric-val">{opt.lockIn}</span>
              </div>
              <div>
                <span className="metric-lbl">Expected Returns</span>
                <span className="metric-val text-green">{opt.expectedReturn}</span>
              </div>
              <div>
                <span className="metric-lbl">Max Deduction</span>
                <span className="metric-val">{opt.maxLimit}</span>
              </div>
            </div>

            <button 
              className="btn-invest-tax-opt"
              onClick={() => {
                setInvestAmount(opt.suggestedInvest.toString());
                setSelectedInvestModal(opt);
              }}
            >
              <span>Invest & Save Tax</span>
              <ChevronRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* One-Click Direct Invest Modal */}
      {selectedInvestModal && (
        <div className="tax-modal-backdrop" onClick={() => setSelectedInvestModal(null)}>
          <div className="tax-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="tax-modal-header">
              <ShieldCheck size={20} color="#ff6600" />
              <h4>Tax Investment Execution</h4>
            </div>

            {investSuccess ? (
              <div className="invest-success-view">
                <Check size={40} color="#00ff88" />
                <h4>Tax Investment Executed!</h4>
                <p>₹{parseFloat(investAmount).toLocaleString()} allocated into {selectedInvestModal.title}.</p>
              </div>
            ) : (
              <>
                <p><strong>Selected Instrument:</strong> {selectedInvestModal.title}</p>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>{selectedInvestModal.desc}</p>

                <div className="input-group-tax">
                  <label>Investment Amount (₹):</label>
                  <input 
                    type="number" 
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                  />
                </div>

                <div className="tax-disclaimer-panel">
                  <Info size={14} color="#ff6600" />
                  <p>Educational estimate based on Section {selectedInvestModal.category} limits. Confirm with certified advisors for individual eligibility.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                  <button className="btn-cancel-tax" onClick={() => setSelectedInvestModal(null)}>
                    Cancel
                  </button>
                  <button className="btn-confirm-tax" onClick={handleExecuteTaxInvest}>
                    Confirm & Save Tax
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxSavingsHub;
