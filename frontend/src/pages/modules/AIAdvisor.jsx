import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { 
  BrainCircuit, 
  Sparkles, 
  Calculator,
  Info
} from 'lucide-react';
import HabitualContext from '../../components/HabitualContext';
import TaxSavingsHub from '../../components/TaxSavingsHub';
import './AIAdvisor.css';

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

const AIAdvisor = () => {
  const { t } = useLanguage();
  // Personalized Recs State
  const [recs, setRecs] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [errorRecs, setErrorRecs] = useState(null);

  // MPT Rebalancer State
  const [riskScore, setRiskScore] = useState(8);
  const [rebalanceResult, setRebalanceResult] = useState(null);
  const [loadingRebalance, setLoadingRebalance] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);

  // Market Forecast State
  const [activeSeries, setActiveSeries] = useState('stocks');
  const [forecast, setForecast] = useState([]);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [errorForecast, setErrorForecast] = useState(null);

  // Tax Optimizer State
  const [taxRecs, setTaxRecs] = useState([]);
  const [loadingTax, setLoadingTax] = useState(true);

  // Quick Tax Regime Solver State
  const [grossIncome, setGrossIncome] = useState('1800000');
  const [taxRegimeResult, setTaxRegimeResult] = useState(null);
  const [solvingTax, setSolvingTax] = useState(false);

  useEffect(() => {
    fetchPersonalizedRecs();
    fetchPortfolioAndRebalance();
    fetchTaxRecs();
    fetchMarketForecast('stocks');
  }, []);

  const fetchPersonalizedRecs = async () => {
    try {
      setLoadingRecs(true);
      const res = await api.get('/api/advisor/recommendations');
      setRecs(res || []);
      setErrorRecs(null);
    } catch (err) {
      console.error('Failed to load personalized recommendations', err);
      setErrorRecs(t('common.offline'));
    } finally {
      setLoadingRecs(false);
    }
  };

  const fetchPortfolioAndRebalance = async () => {
    try {
      const port = await api.get('/api/portfolio/');
      setPortfolioData(port);
      if (port) {
        runRebalanceMVO(riskScore, port);
      }
    } catch (err) {
      console.error('Failed to fetch portfolio weights', err);
    }
  };

  const runRebalanceMVO = async (score, port) => {
    setLoadingRebalance(true);
    try {
      let currentAllocation = {
        "Bonds": 0.25,
        "Equity/Stocks": 0.50,
        "Gold": 0.15,
        "Mutual Funds": 0.10
      };

      if (port && port.assets && port.investments) {
        const goldVal = port.assets.filter(a => a.type === 'GOLD').reduce((acc, x) => acc + (x.currentValue || 0), 0);
        const bondsVal = port.investments.filter(i => i.type === 'FD' || i.type === 'PPF').reduce((acc, x) => acc + (x.amount || 0), 0);
        const equityVal = port.investments.filter(i => i.type === 'STOCK' || i.type === 'EQUITY').reduce((acc, x) => acc + (x.amount || 0), 0);
        const mfVal = port.investments.filter(i => i.type === 'SIP' || i.type === 'MF' || i.type === 'ELSS' || i.type === 'MUTUAL_FUND').reduce((acc, x) => acc + (x.amount || 0), 0);

        const total = goldVal + bondsVal + equityVal + mfVal;
        if (total > 0) {
          currentAllocation = {
            "Bonds": bondsVal / total,
            "Equity/Stocks": equityVal / total,
            "Gold": goldVal / total,
            "Mutual Funds": mfVal / total
          };
        }
      }

      const response = await fetch('http://localhost:8000/api/rebalance-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Risk_Appetite_Score: parseInt(score),
          current_allocation: currentAllocation
        })
      });

      if (!response.ok) throw new Error('Rebalancer failed');
      const resData = await response.json();
      setRebalanceResult(resData);
    } catch (err) {
      console.error('Failed to run portfolio rebalancer', err);
    } finally {
      setLoadingRebalance(false);
    }
  };

  const fetchMarketForecast = async (series) => {
    setActiveSeries(series);
    setLoadingForecast(true);
    try {
      const response = await fetch(`http://localhost:8000/api/market-forecast/${series}?days=30`);
      if (!response.ok) throw new Error('Forecast offline');
      const data = await response.json();
      setForecast(data.forecast || []);
      setErrorForecast(null);
    } catch (err) {
      console.error('Market forecast unreachable', err);
      setErrorForecast(t('common.offline'));
      setForecast([]);
    } finally {
      setLoadingForecast(false);
    }
  };

  const fetchTaxRecs = async () => {
    try {
      setLoadingTax(true);
      const res = await api.get('/api/tax/recommendations');
      setTaxRecs(res || []);
    } catch (err) {
      console.error('Tax recommendations unreachable', err);
    } finally {
      setLoadingTax(false);
    }
  };

  const handleSolveTax = async (e) => {
    e.preventDefault();
    setSolvingTax(true);
    try {
      const age = 30; 
      const response = await fetch('http://localhost:8000/api/tax-saving?regime=new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Age: age,
          Annual_Income_INR: parseFloat(grossIncome),
          Current_Savings_INR: 500000.0,
          Monthly_Disposable_Income_INR: parseFloat(grossIncome) * 0.3 / 12,
          Tax_Bracket: "30%",
          Financial_Goal: "Tax Saving",
          Risk_Appetite_Score: riskScore,
          Investment_Horizon_Months: 60
        })
      });

      if (!response.ok) throw new Error('Tax solver failed');
      const data = await response.json();
      setTaxRegimeResult(data);
    } catch (err) {
      console.error('Failed to solve tax regime comparison', err);
    } finally {
      setSolvingTax(false);
    }
  };

  const handleRiskChange = (e) => {
    const val = parseInt(e.target.value);
    setRiskScore(val);
    runRebalanceMVO(val, portfolioData);
  };

  const getForecastLine = () => {
    if (forecast.length < 2) return '';
    const width = 500;
    const height = 150;
    const padding = 20;

    const values = forecast.map(f => f.predicted_value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    return forecast.map((f, idx) => {
      const x = (idx / (forecast.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((f.predicted_value - minVal) / range) * (height - padding * 2) - padding;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const forecastPath = getForecastLine();

  return (
    <motion.div 
      className="advisor-content-wrapper"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Top Banner */}
      <div className="advisor-header-banner">
        <div className="banner-title-group">
          <BrainCircuit size={28} className="banner-icon" />
          <div>
            <h2>{t('advisor.header')}</h2>
            <p>{t('advisor.subHeader')}</p>
          </div>
        </div>
      </div>

      {/* Feature 1: Habitual Context & Recommendations */}
      <HabitualContext />

      {/* Feature 2: Tax Savings Options Hub */}
      <TaxSavingsHub />

      {/* Upper Grid: AI personalized Recs & Forecast */}
      <div className="advisor-upper-grid">
        
        {/* Personalized Recommendations */}
        <motion.div className="advisor-card recs-card" variants={cardItemVariants}>
          <div className="card-header-plain">
            <h3>{t('advisor.smartRecs')}</h3>
          </div>

          <div className="recs-container">
            {loadingRecs ? (
              <div className="recs-loading">
                <div className="spinner"></div>
                <p>{t('common.loading')}</p>
              </div>
            ) : errorRecs ? (
              <p className="error-advisor-msg">{errorRecs}</p>
            ) : recs.length > 0 ? (
              <div className="recs-list">
                {recs.map((rec, idx) => (
                  <div key={idx} className="rec-item">
                    <div className="rec-badge-row">
                      <span className="rec-type-badge">{rec.type}</span>
                      <span className="rec-confidence-badge">Confidence: {(rec.confidenceScore * 100).toFixed(0)}%</span>
                    </div>
                    <h4>{rec.title}</h4>
                    <p className="rec-desc">{rec.description}</p>
                    
                    <div className="rec-explanation-box">
                      <Info size={14} />
                      <p>{rec.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-msg">{t('common.noData')}</p>
            )}
          </div>
        </motion.div>

        {/* Market Forecasting Panel */}
        <motion.div className="advisor-card forecast-card" variants={cardItemVariants}>
          <div className="card-header-plain">
            <h3>30-Day Market Predictions</h3>
            <div className="series-selectors">
              <button className={activeSeries === 'stocks' ? 'active' : ''} onClick={() => fetchMarketForecast('stocks')}>{t('advisor.equity')}</button>
              <button className={activeSeries === 'gold' ? 'active' : ''} onClick={() => fetchMarketForecast('gold')}>{t('advisor.goldAsset')}</button>
              <button className={activeSeries === 'inflation' ? 'active' : ''} onClick={() => fetchMarketForecast('inflation')}>Inflation</button>
            </div>
          </div>

          <div className="forecast-chart-container">
            {loadingForecast ? (
              <div className="forecast-chart-loading">{t('common.loading')}</div>
            ) : errorForecast ? (
              <p className="error-advisor-msg">{errorForecast}</p>
            ) : forecast.length > 0 ? (
              <div className="forecast-visualization-box">
                <svg viewBox="0 0 500 150" width="100%" height="150" className="svg-networth-chart">
                  <motion.path 
                    d={forecastPath} 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                  
                  {forecast.length > 0 && (
                    <>
                      <circle cx="20" cy="75" r="4" fill="#10b981" />
                      <circle cx="480" cy="75" r="4" fill="#10b981" />
                    </>
                  )}
                </svg>

                <div className="forecast-endpoints-row">
                  <div className="endpoint-item">
                    <span>START VALUE</span>
                    <h4>₹{forecast[0]?.predicted_value}</h4>
                  </div>
                  <div className="endpoint-item right">
                    <span>PROJECTED VALUE (30D)</span>
                    <h4 style={{ color: forecast[forecast.length - 1]?.predicted_value >= forecast[0]?.predicted_value ? '#10b981' : '#ef4444' }}>
                      ₹{forecast[forecast.length - 1]?.predicted_value}
                    </h4>
                  </div>
                </div>
              </div>
            ) : (
              <p className="no-data-msg">{t('common.noData')}</p>
            )}
          </div>
          <div className="forecast-disclaimer-text">
            *Prophet time-series predictions. For informational purposes only.
          </div>
        </motion.div>

      </div>

      {/* Middle Grid: MPT Rebalancer */}
      <motion.div className="advisor-card rebalancer-card-box" variants={cardItemVariants}>
        <div className="card-header-plain">
          <h3>{t('advisor.mptTitle')}</h3>
          <div className="risk-slider-container">
            <label>{t('advisor.riskLevel')}: <strong>{riskScore}</strong></label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={riskScore}
              onChange={handleRiskChange}
              className="risk-range-slider"
            />
          </div>
        </div>

        {loadingRebalance ? (
          <p className="rebalance-loading-msg">{t('common.loading')}</p>
        ) : rebalanceResult ? (
          <div className="rebalancer-grid">
            
            {/* Optimal Weights Allocation Chart */}
            <div className="rebalancer-weights-box">
              <h4>{t('advisor.targetAllocation')}</h4>
              <div className="weights-bars-container">
                {Object.entries(rebalanceResult.recommended_weights || {}).map(([asset, weight]) => (
                  <div key={asset} className="weight-bar-item">
                    <div className="weight-bar-info">
                      <span>{asset}</span>
                      <strong>{weight}%</strong>
                    </div>
                    <div className="weight-bar-track">
                      <motion.div 
                        className="weight-bar-fill" 
                        initial={{ width: '0%' }}
                        animate={{ width: `${weight}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="frontier-meta-box">
                <div className="meta-metric">
                  <span>EXPECTED RETURN</span>
                  <strong>{rebalanceResult.expected_return_pct}%</strong>
                </div>
                <div className="meta-metric">
                  <span>EXPECTED VOLATILITY</span>
                  <strong>{rebalanceResult.expected_volatility_pct}%</strong>
                </div>
                <div className="meta-metric">
                  <span>SHARPE RATIO</span>
                  <strong style={{ color: '#10b981' }}>{rebalanceResult.sharpe_ratio}</strong>
                </div>
              </div>
            </div>

            {/* Concrete buy/sell execution actions */}
            <div className="rebalancer-actions-box">
              <h4>{t('advisor.mptTitle')}</h4>
              {rebalanceResult.rebalancing_actions && rebalanceResult.rebalancing_actions.length > 0 ? (
                <div className="actions-steps-list">
                  {rebalanceResult.rebalancing_actions.map((act, idx) => (
                    <div key={idx} className={`action-step-card ${act.action}`}>
                      <div className="step-cell-header">
                        <h5>{act.asset_class}</h5>
                        <span className={`badge-action ${act.action}`}>{act.action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-panel-actions">
                  <p>{t('advisor.recApplied')}</p>
                </div>
              )}
            </div>

          </div>
        ) : (
          <p className="no-data-msg">{t('common.offline')}</p>
        )}
      </motion.div>

      {/* Lower Row: Tax savings optimizer */}
      <motion.div className="advisor-card tax-optimizer-box" variants={cardItemVariants}>
        <div className="card-header-plain">
          <h3>{t('advisor.taxOptimizerTitle')}</h3>
        </div>

        <div className="tax-dashboard-grid">
          
          {/* Active tax recs */}
          <div className="tax-recs-column">
            <h4>{t('advisor.sec80C')}</h4>
            {loadingTax ? (
              <p className="loading-advisor-msg">{t('common.loading')}</p>
            ) : taxRecs.length > 0 ? (
              <div className="tax-recs-list">
                {taxRecs.map((tRec, idx) => (
                  <div key={idx} className="tax-rec-item-card">
                    <div className="tax-rec-header">
                      <span className="tax-section-badge">Section {tRec.section}</span>
                      <span className="tax-instrument-text">{tRec.instrument}</span>
                    </div>
                    
                    <p className="tax-rec-explanation">{tRec.explanation}</p>
                    
                    <div className="tax-amounts-row">
                      <div className="amt-box">
                        <span>{t('advisor.currentDeduction')}</span>
                        <strong>₹{tRec.suggestedAmount?.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="amt-box right">
                        <span>{t('advisor.potentialSavings')}</span>
                        <strong className="savings-highlight">₹{tRec.potentialTaxSaving?.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-msg">{t('common.noData')}</p>
            )}
          </div>

          {/* Tax Slab Solver comparison */}
          <div className="tax-comparison-form-column">
            <h4>{t('advisor.regimeSolver')}</h4>
            
            <form onSubmit={handleSolveTax} className="tax-solver-form">
              <div className="form-group">
                <label>{t('advisor.grossIncome')}</label>
                <div className="input-with-action">
                  <input 
                    type="number" 
                    value={grossIncome} 
                    onChange={(e) => setGrossIncome(e.target.value)} 
                    placeholder="e.g. 1800000" 
                    required
                  />
                  <button type="submit" className="btn btn-primary btn-tax-solve" disabled={solvingTax}>
                    {solvingTax ? t('common.submitting') : t('advisor.solveRegime')}
                  </button>
                </div>
              </div>
            </form>

            {taxRegimeResult ? (
              <div className="tax-solver-results">
                <div className="comparison-winner-badge">
                  <Sparkles size={16} />
                  <span>{t('advisor.recommended')}: </span>
                  <strong>{taxRegimeResult.recommended_regime?.toUpperCase()}</strong>
                </div>
                <div className="comparison-table-wrapper">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>REGIME</th>
                        <th>SLAB TAX</th>
                        <th>DEDUCTIONS</th>
                        <th>FINAL LIABILITY</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={taxRegimeResult.recommended_regime === 'old' ? 'winner-row' : ''}>
                        <td><strong>Old Regime (Maxed)</strong></td>
                        <td>₹{taxRegimeResult.comparison?.old_regime_tax_inr_no_deductions?.toLocaleString('en-IN')}</td>
                        <td>₹{(taxRegimeResult.comparison?.old_regime_tax_inr_no_deductions - taxRegimeResult.comparison?.old_regime_tax_inr_fully_maxed > 0 ? (taxRegimeResult.comparison?.old_regime_tax_inr_no_deductions - taxRegimeResult.comparison?.old_regime_tax_inr_fully_maxed) : 0).toLocaleString('en-IN')}</td>
                        <td className="final-tax-val">₹{taxRegimeResult.comparison?.old_regime_tax_inr_fully_maxed?.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr className={taxRegimeResult.recommended_regime === 'new' ? 'winner-row' : ''}>
                        <td><strong>New Regime</strong></td>
                        <td>₹{taxRegimeResult.comparison?.new_regime_tax_inr?.toLocaleString('en-IN')}</td>
                        <td>₹0</td>
                        <td className="final-tax-val">₹{taxRegimeResult.comparison?.new_regime_tax_inr?.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="net-savings-callout">
                  Net Tax Savings: <strong style={{ color: '#10b981' }}>₹{Math.abs(taxRegimeResult.comparison?.old_regime_tax_inr_fully_maxed - taxRegimeResult.comparison?.new_regime_tax_inr).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            ) : (
              <div className="empty-panel tax-placeholder">
                <Calculator size={24} />
                <p>{t('advisor.regimeSolver')}</p>
              </div>
            )}
          </div>

        </div>
      </motion.div>

    </motion.div>
  );
};

export default AIAdvisor;
