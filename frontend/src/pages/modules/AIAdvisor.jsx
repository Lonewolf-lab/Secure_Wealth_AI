import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  BrainCircuit, 
  TrendingUp, 
  HelpCircle, 
  Sparkles, 
  PieChart, 
  Calculator,
  Compass,
  ArrowRight,
  TrendingDown,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import './AIAdvisor.css';

const AIAdvisor = () => {
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
      setErrorRecs('Advisor service offline.');
    } finally {
      setLoadingRecs(false);
    }
  };

  const fetchPortfolioAndRebalance = async () => {
    try {
      const port = await api.get('/api/portfolio/');
      setPortfolioData(port);
      if (port) {
        // Calculate current weights
        runRebalanceMVO(riskScore, port);
      }
    } catch (err) {
      console.error('Failed to fetch portfolio weights', err);
    }
  };

  const runRebalanceMVO = async (score, port) => {
    setLoadingRebalance(true);
    try {
      const p = port || portfolioData;
      let currentAllocation = {
        "Bonds": 0.25,
        "Equity/Stocks": 0.25,
        "Gold": 0.25,
        "Mutual Funds": 0.25
      };

      if (p) {
        const assets = p.assets || [];
        const investments = p.investments || [];

        const goldVal = assets.filter(a => a.type === 'GOLD').reduce((sum, a) => sum + (a.currentValue || 0), 0);
        const bondsVal = investments.filter(i => i.type === 'FD' || i.type === 'PPF').reduce((sum, i) => sum + (i.amount || 0), 0);
        const equityVal = investments.filter(i => i.type === 'STOCK').reduce((sum, i) => sum + (i.amount || 0), 0);
        const mfVal = investments.filter(i => i.type === 'SIP' || i.type === 'ELSS').reduce((sum, i) => sum + (i.amount || 0), 0);

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

      // Call Python FastAPI service directly on port 8000
      const response = await fetch('http://localhost:8000/api/rebalance-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Risk_Appetite_Score: parseInt(score),
          current_allocation: currentAllocation
        })
      });

      if (!response.ok) {
        throw new Error('Rebalancer failed');
      }

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
      // Call Python FastAPI service directly on port 8000
      const response = await fetch(`http://localhost:8000/api/market-forecast/${series}?days=30`);
      if (!response.ok) {
        throw new Error('Forecast offline');
      }
      const data = await response.json();
      setForecast(data.forecast || []);
      setErrorForecast(null);
    } catch (err) {
      console.error('Market forecast unreachable', err);
      setErrorForecast('Forecast engine offline.');
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
      // Fetch user profile age to match model constraints (default 30)
      const age = 30; 
      const response = await fetch('http://localhost:8000/api/tax-saving?regime=new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Age: age,
          Annual_Income_INR: parseFloat(grossIncome),
          Current_Savings_INR: 500000.0, // default tracking
          Monthly_Disposable_Income_INR: parseFloat(grossIncome) * 0.3 / 12,
          Tax_Bracket: "30%",
          Financial_Goal: "Tax Saving",
          Risk_Appetite_Score: riskScore,
          Investment_Horizon_Months: 60
        })
      });

      if (!response.ok) {
        throw new Error('Tax solver failed');
      }

      const data = await response.json();
      setTaxRegimeResult(data);
    } catch (err) {
      console.error('Failed to solve tax regime comparison', err);
      alert('Tax calculation error.');
    } finally {
      setSolvingTax(false);
    }
  };

  const handleRiskChange = (e) => {
    const val = parseInt(e.target.value);
    setRiskScore(val);
    runRebalanceMVO(val, portfolioData);
  };

  // SVG Line Path Calculation for Forecast
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
    <div className="advisor-content-wrapper">
      
      {/* Upper Grid: AI personalized Recs & Forecast */}
      <div className="advisor-upper-grid">
        
        {/* Personalized Recommendations */}
        <div className="advisor-card recs-card">
          <div className="card-header-plain">
            <h3>AI Wealth Advisor</h3>
            <span className="card-header-icon-badge"><BrainCircuit size={16} /></span>
          </div>

          <div className="recs-scroll-container">
            {loadingRecs ? (
              <p className="loading-advisor-msg">Scanning profile metrics...</p>
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

                    <span className="rec-trigger-label">Trigger: {rec.marketTrigger}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-msg">No advisor recommendations generated.</p>
            )}
          </div>
        </div>

        {/* Market Forecasting Panel */}
        <div className="advisor-card forecast-card">
          <div className="card-header-plain">
            <h3>30-Day Market Predictions</h3>
            <div className="series-selectors">
              <button className={activeSeries === 'stocks' ? 'active' : ''} onClick={() => fetchMarketForecast('stocks')}>Stocks</button>
              <button className={activeSeries === 'gold' ? 'active' : ''} onClick={() => fetchMarketForecast('gold')}>Gold</button>
              <button className={activeSeries === 'inflation' ? 'active' : ''} onClick={() => fetchMarketForecast('inflation')}>Inflation</button>
            </div>
          </div>

          <div className="forecast-chart-container">
            {loadingForecast ? (
              <div className="forecast-chart-loading">Computing Prophet trends...</div>
            ) : errorForecast ? (
              <p className="error-advisor-msg">{errorForecast}</p>
            ) : forecast.length > 0 ? (
              <div className="forecast-visualization-box">
                <svg viewBox="0 0 500 150" width="100%" height="150" className="svg-networth-chart">
                  <path d={forecastPath} fill="none" stroke="#00ff88" strokeWidth="2.5" strokeLinecap="round" />
                  
                  {/* Min / Max labels */}
                  {forecast.length > 0 && (
                    <>
                      <circle cx="20" cy="75" r="4" fill="#00ff88" />
                      <circle cx="480" cy="75" r="4" fill="#00ff88" />
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
                    <h4 style={{ color: forecast[forecast.length - 1]?.predicted_value >= forecast[0]?.predicted_value ? '#00ff88' : '#ff3366' }}>
                      ₹{forecast[forecast.length - 1]?.predicted_value}
                    </h4>
                  </div>
                </div>
              </div>
            ) : (
              <p className="no-data-msg">No market forecasts loaded.</p>
            )}
          </div>

          <div className="forecast-disclaimer-text">
            *Prophet time-series predictions. For informational purposes only.
          </div>
        </div>

      </div>

      {/* Middle Grid: MPT Rebalancer */}
      <div className="advisor-card rebalancer-card-box">
        <div className="card-header-plain">
          <h3>Mean-Variance Optimization (Markowitz Rebalancer)</h3>
          <div className="risk-slider-container">
            <label>RISK appetite: <strong>{riskScore}</strong></label>
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
          <p className="rebalance-loading-msg">Running solver matrices...</p>
        ) : rebalanceResult ? (
          <div className="rebalancer-grid">
            
            {/* Optimal Weights Allocation Chart */}
            <div className="rebalancer-weights-box">
              <h4>Target Asset Allocation</h4>
              <div className="weights-bars-container">
                {Object.entries(rebalanceResult.recommended_weights || {}).map(([asset, weight]) => (
                  <div key={asset} className="weight-bar-item">
                    <div className="weight-bar-info">
                      <span>{asset}</span>
                      <strong>{weight}%</strong>
                    </div>
                    <div className="weight-bar-track">
                      <div className="weight-bar-fill" style={{ width: `${weight}%` }}></div>
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
                  <strong style={{ color: '#00ff88' }}>{rebalanceResult.sharpe_ratio}</strong>
                </div>
              </div>
            </div>

            {/* Concrete buy/sell execution actions */}
            <div className="rebalancer-actions-box">
              <h4>Rebalancing Execution Steps</h4>
              {rebalanceResult.rebalancing_actions && rebalanceResult.rebalancing_actions.length > 0 ? (
                <div className="actions-steps-list">
                  {rebalanceResult.rebalancing_actions.map((act, idx) => (
                    <div key={idx} className={`action-step-card ${act.action}`}>
                      <div className="step-cell-header">
                        <h5>{act.asset_class}</h5>
                        <span className={`badge-action ${act.action}`}>{act.action}</span>
                      </div>
                      
                      <div className="step-delta-details">
                        <span>Current: {act.current_weight_pct}%</span>
                        <span>Target: {act.recommended_weight_pct}%</span>
                        <strong className="delta-indicator">
                          {act.change_percentage_points > 0 ? '+' : ''}{act.change_percentage_points}%
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-panel-actions">
                  <p>Your current allocations are perfectly aligned with the optimal efficient frontier at risk appetite {riskScore}. No adjustments required.</p>
                </div>
              )}
            </div>

          </div>
        ) : (
          <p className="no-data-msg">Rebalancing solver offline.</p>
        )}
      </div>

      {/* Lower Row: Tax savings optimizer */}
      <div className="advisor-card tax-optimizer-box">
        <div className="card-header-plain">
          <h3>Section 80C Tax-Saving Optimizer</h3>
        </div>

        <div className="tax-dashboard-grid">
          
          {/* Active tax recs */}
          <div className="tax-recs-column">
            <h4>Deduction Highlights</h4>
            {loadingTax ? (
              <p className="loading-advisor-msg">Analyzing deductions...</p>
            ) : taxRecs.length > 0 ? (
              <div className="tax-recs-list">
                {taxRecs.map((t, idx) => (
                  <div key={idx} className="tax-rec-item-card">
                    <div className="tax-rec-header">
                      <span className="tax-section-badge">Section {t.section}</span>
                      <span className="tax-instrument-text">{t.instrument}</span>
                    </div>
                    
                    <p className="tax-rec-explanation">{t.explanation}</p>
                    
                    <div className="tax-amounts-row">
                      <div className="amt-box">
                        <span>SUGGESTED ALLOCATION</span>
                        <strong>₹{t.suggestedAmount?.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="amt-box right">
                        <span>POTENTIAL SAVINGS</span>
                        <strong className="savings-highlight">₹{t.potentialTaxSaving?.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-msg">No tax optimization suggestions available.</p>
            )}
          </div>

          {/* Tax Slab Solver comparison */}
          <div className="tax-comparison-form-column">
            <h4>Old vs New Regime Solver</h4>
            <p className="tax-solver-desc">Compute slab liabilities side-by-side adjusted for Budget 2025/2026 guidelines.</p>
            
            <form onSubmit={handleSolveTax} className="tax-solver-form">
              <div className="form-group">
                <label>GROSS ANNUAL INCOME (INR)</label>
                <div className="input-with-action">
                  <input 
                    type="number" 
                    value={grossIncome} 
                    onChange={(e) => setGrossIncome(e.target.value)} 
                    placeholder="e.g. 1800000" 
                    required
                  />
                  <button type="submit" className="btn btn-primary btn-tax-solve" disabled={solvingTax}>
                    {solvingTax ? 'SOLVING...' : 'SOLVE'}
                  </button>
                </div>
              </div>
            </form>

            {taxRegimeResult ? (
              <div className="tax-solver-results">
                <div className="comparison-winner-badge">
                  <Sparkles size={16} />
                  <span>RECOMMENDED REGIME: </span>
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
                  Net Tax Savings: <strong style={{ color: '#00ff88' }}>₹{Math.abs(taxRegimeResult.comparison?.old_regime_tax_inr_fully_maxed - taxRegimeResult.comparison?.new_regime_tax_inr).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            ) : (
              <div className="empty-panel tax-placeholder">
                <Calculator size={24} />
                <p>Submit your gross income above to evaluate Old vs New progressive tax slab comparisons.</p>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default AIAdvisor;
