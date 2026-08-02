import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { 
  TrendingUp, 
  Sparkles, 
  Sliders, 
  PauseCircle, 
  PlayCircle, 
  ArrowUpRight, 
  Check, 
  Calendar, 
  DollarSign,
  AlertTriangle,
  Info
} from 'lucide-react';
import '../styles/feature-previews.css';
import './SIPAdjuster.css';

const SIPAdjuster = () => {
  const { t } = useLanguage();
  
  // Active SIP State
  const [sips, setSips] = useState([
    {
      id: 'sip_1',
      name: 'PSB Bluechip Equity SIP',
      currentAmount: 10000,
      frequency: 'Monthly',
      nextDate: '2026-08-10',
      stepUpPercent: 10,
      status: 'ACTIVE',
      category: 'ELSS Equity'
    },
    {
      id: 'sip_2',
      name: 'Nifty 50 Index Fund SIP',
      currentAmount: 5000,
      frequency: 'Monthly',
      nextDate: '2026-08-15',
      stepUpPercent: 5,
      status: 'ACTIVE',
      category: 'Large Cap'
    }
  ]);

  const [selectedSipModal, setSelectedSipModal] = useState(null);
  const [newAmount, setNewAmount] = useState(10000);
  const [newStepUp, setNewStepUp] = useState(10);
  const [isSuccess, setIsSuccess] = useState(false);

  // Calculate 10-Year Compounding Wealth Projections
  const calculateCompoundingWealth = (monthlySip, stepUpRate) => {
    const returnRate = 0.12; // 12% p.a.
    const years = 10;
    let totalInvested = 0;
    let corpus = 0;

    let currentMonthly = monthlySip;

    for (let yr = 1; yr <= years; yr++) {
      for (let m = 1; m <= 12; m++) {
        totalInvested += currentMonthly;
        corpus = (corpus + currentMonthly) * (1 + returnRate / 12);
      }
      currentMonthly = currentMonthly * (1 + stepUpRate / 100);
    }

    return {
      totalInvested: Math.round(totalInvested),
      projectedCorpus: Math.round(corpus),
      wealthGain: Math.round(corpus - totalInvested)
    };
  };

  const handleOpenAdjustModal = (sip) => {
    setSelectedSipModal(sip);
    setNewAmount(sip.currentAmount);
    setNewStepUp(sip.stepUpPercent);
    setIsSuccess(false);
  };

  const handleTogglePause = (sipId) => {
    setSips(prev => prev.map(s => {
      if (s.id === sipId) {
        const nextStatus = s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  const handleConfirmAdjustment = () => {
    setIsSuccess(true);
    setTimeout(() => {
      setSips(prev => prev.map(s => {
        if (s.id === selectedSipModal.id) {
          return {
            ...s,
            currentAmount: parseFloat(newAmount),
            stepUpPercent: parseFloat(newStepUp)
          };
        }
        return s;
      }));
      setSelectedSipModal(null);
      setIsSuccess(false);
    }, 1400);
  };

  const projection = selectedSipModal ? calculateCompoundingWealth(parseFloat(newAmount || 0), parseFloat(newStepUp || 0)) : null;

  return (
    <div className="feature-preview--sip sip-adjuster-card">
      {/* High-Visibility Testing Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="feature-tag--sip">
          <Sparkles size={13} />
          <span>[NEW — SIP ADJUSTMENT]</span>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#39ff14', fontFamily: 'monospace' }}>
          FEAT-3 ACTIVE • VISUAL TEST MODE
        </span>
      </div>

      {/* Header */}
      <div className="sip-header">
        <div className="sip-title-box">
          <div className="sip-icon-glow">
            <Sliders size={22} />
          </div>
          <div>
            <h3>{t('sip.title') || 'Active SIP Manager & Step-Up Scaling'}</h3>
            <p>{t('sip.subtitle') || 'Dynamically increase contributions, set annual salary step-ups, or simulate compounding multiplier impact'}</p>
          </div>
        </div>

        <div className="sip-total-pill">
          <span>Active Monthly Commitment: </span>
          <strong>₹{sips.reduce((acc, x) => acc + (x.status === 'ACTIVE' ? x.currentAmount : 0), 0).toLocaleString()}/mo</strong>
        </div>
      </div>

      {/* Active SIP List */}
      <div className="sip-cards-list">
        {sips.map((sip) => (
          <div key={sip.id} className={`sip-item-card ${sip.status.toLowerCase()}`}>
            <div className="sip-item-main">
              <div>
                <span className="sip-cat">{sip.category}</span>
                <h4 className="sip-name">{sip.name}</h4>
                <div className="sip-details-line">
                  <span>Next Debit: <strong>{sip.nextDate}</strong></span>
                  <span> • Frequency: <strong>{sip.frequency}</strong></span>
                </div>
              </div>

              <div className="sip-amount-box">
                <span className="sip-amt-lbl">Current Monthly SIP</span>
                <span className="sip-amt-val">₹{sip.currentAmount.toLocaleString()}</span>
                <span className="sip-stepup-tag">+{sip.stepUpPercent}% Annual Step-Up</span>
              </div>
            </div>

            <div className="sip-actions-bar">
              <button 
                className={`btn-pause-sip ${sip.status === 'PAUSED' ? 'paused' : ''}`}
                onClick={() => handleTogglePause(sip.id)}
              >
                {sip.status === 'ACTIVE' ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                <span>{sip.status === 'ACTIVE' ? 'Pause SIP' : 'Resume SIP'}</span>
              </button>

              <button 
                className="btn-adjust-sip"
                onClick={() => handleOpenAdjustModal(sip)}
              >
                <Sliders size={14} />
                <span>Adjust Amount & Step-Up</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Adjustment Simulation Modal */}
      {selectedSipModal && (
        <div className="sip-modal-backdrop" onClick={() => setSelectedSipModal(null)}>
          <div className="sip-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sip-modal-header">
              <TrendingUp size={20} color="#39ff14" />
              <h4>SIP Adjustment & Compounding Simulator</h4>
            </div>

            {isSuccess ? (
              <div className="sip-success-view">
                <Check size={40} color="#39ff14" />
                <h4>SIP Updated Successfully!</h4>
                <p>New commitment ₹{parseFloat(newAmount).toLocaleString()}/mo with +{newStepUp}% annual step-up applied.</p>
              </div>
            ) : (
              <>
                <p className="sip-modal-fund-name"><strong>SIP:</strong> {selectedSipModal.name}</p>

                {/* Form Controls */}
                <div className="sip-input-group">
                  <label>New Monthly Amount (₹):</label>
                  <input 
                    type="number"
                    step="500"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                </div>

                <div className="sip-input-group">
                  <label>Annual Step-Up Increase: <strong>+{newStepUp}% per year</strong></label>
                  <input 
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    value={newStepUp}
                    onChange={(e) => setNewStepUp(e.target.value)}
                  />
                </div>

                {/* Compounding Projections Panel */}
                {projection && (
                  <div className="compounding-projection-box">
                    <h5>10-Year Wealth Projection Impact</h5>
                    <div className="compounding-grid">
                      <div>
                        <span className="c-lbl">Total Invested</span>
                        <span className="c-val">₹{(projection.totalInvested / 100000).toFixed(2)} L</span>
                      </div>
                      <div>
                        <span className="c-lbl">Expected Corpus (12% p.a.)</span>
                        <span className="c-val text-lime">₹{(projection.projectedCorpus / 100000).toFixed(2)} L</span>
                      </div>
                      <div>
                        <span className="c-lbl">Pure Wealth Gain</span>
                        <span className="c-val text-lime">+₹{(projection.wealthGain / 100000).toFixed(2)} L</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="sip-disclaimer-box">
                  <Info size={14} color="#bf00ff" />
                  <p>Projections use standard 12% p.a. equity CAGR assumptions. SIP adjustments take effect on the next billing date ({selectedSipModal.nextDate}).</p>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem' }}>
                  <button className="btn-cancel-sip" onClick={() => setSelectedSipModal(null)}>
                    Cancel
                  </button>
                  <button className="btn-confirm-sip" onClick={handleConfirmAdjustment}>
                    Confirm & Update SIP
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

export default SIPAdjuster;
