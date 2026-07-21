import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import CountUp from '../../components/CountUp';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  Building, 
  Car, 
  Coins, 
  Coins as OtherIcon, 
  DollarSign, 
  X,
  ShieldCheck
} from 'lucide-react';
import './Portfolio.css';

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

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('PROPERTY');
  const [assetValue, setAssetValue] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const [portRes, histRes] = await Promise.all([
        api.get('/api/portfolio/'),
        api.get('/api/portfolio/history')
      ]);
      setPortfolio(portRes);
      setHistory(histRes || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load portfolio details', err);
      setError('Unable to retrieve portfolio assets. Confirm backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!assetName || !assetValue) return;

    try {
      setSubmitting(true);
      const val = parseFloat(assetValue);
      await api.post('/api/assets', {
        name: assetName,
        type: assetType,
        currentValue: val,
        purchaseValue: val,
        purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
        notes: notes || 'Manual asset logging'
      });

      setAssetName('');
      setAssetType('PROPERTY');
      setAssetValue('');
      setPurchaseDate('');
      setNotes('');
      setShowAddForm(false);
      
      await fetchPortfolioData();
    } catch (err) {
      console.error('Failed to add manual asset', err);
      alert('Failed to log asset. Check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm('Are you sure you want to remove this asset?')) return;
    try {
      await api.delete(`/api/assets/${assetId}`);
      await fetchPortfolioData();
    } catch (err) {
      console.error('Failed to delete asset', err);
      alert('Failed to delete asset.');
    }
  };

  if (loading && !portfolio) {
    return (
      <div className="portfolio-loading">
        <div className="skeleton-line title"></div>
        <div className="skeleton-portfolio-grid">
          <div className="skeleton-box large"></div>
          <div className="skeleton-box small"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-error">
        <h3>Connection offline</h3>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={fetchPortfolioData}>
          RECONNECT PORTFOLIO
        </button>
      </div>
    );
  }

  const { totalValue, assets = [], investments = [] } = portfolio || {};

  const getAssetIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'PROPERTY': return <Building size={18} />;
      case 'VEHICLE': return <Car size={18} />;
      case 'GOLD': return <Coins size={18} />;
      default: return <OtherIcon size={18} />;
    }
  };

  // SVG Chart points calculation
  const getChartPath = () => {
    if (history.length < 2) return '';
    const width = 500;
    const height = 150;
    const padding = 20;

    const values = history.map(h => h.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    return history.map((h, idx) => {
      const x = (idx / (history.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((h.value - minVal) / range) * (height - padding * 2) - padding;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const getChartFillPath = (linePath) => {
    if (!linePath) return '';
    const width = 500;
    const height = 150;
    const padding = 20;
    
    const startX = padding;
    const endX = width - padding;
    return `${linePath} L ${endX} ${height} L ${startX} ${height} Z`;
  };

  const linePath = getChartPath();
  const fillPath = getChartFillPath(linePath);

  return (
    <motion.div 
      className="portfolio-content"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Chart & Summary Row */}
      <div className="portfolio-main-grid">
        
        {/* Net Worth Chart */}
        <motion.div 
          className="portfolio-card chart-card" 
          variants={cardItemVariants}
        >
          <div className="chart-header-box">
            <div>
              <span>PORTFOLIO VALUATION HISTORY</span>
              <h3>Net Worth Compounding</h3>
            </div>
            <div className="compounding-tag">
              <TrendingUp size={14} /> Compounded Monthly
            </div>
          </div>

          <div className="chart-display-container">
            {history.length > 1 ? (
              <svg className="svg-networth-chart" viewBox="0 0 500 150" width="100%" height="150">
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35"/>
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {/* Gradient area */}
                <motion.path 
                  d={fillPath} 
                  fill="url(#chartGlow)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.6 }}
                />
                {/* Glowing line draw animation */}
                <motion.path 
                  d={linePath} 
                  fill="none" 
                  stroke="#06b6d4" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                />
                
                {/* Interactive Points */}
                {history.map((pt, idx) => {
                  const width = 500;
                  const height = 150;
                  const padding = 20;
                  const values = history.map(h => h.value);
                  const minVal = Math.min(...values);
                  const maxVal = Math.max(...values);
                  const range = maxVal - minVal || 1;
                  const x = (idx / (history.length - 1)) * (width - padding * 2) + padding;
                  const y = height - ((pt.value - minVal) / range) * (height - padding * 2) - padding;

                  return (
                    <motion.g 
                      key={idx} 
                      className="chart-marker-group"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.6 + idx * 0.04, duration: 0.3 }}
                    >
                      <circle cx={x} cy={y} r="4" fill="#06b6d4" className="marker-dot" />
                      <circle cx={x} cy={y} r="8" fill="#06b6d4" opacity="0.3" className="marker-glow" />
                    </motion.g>
                  );
                })}
              </svg>
            ) : (
              <p className="no-data-msg">Valuation history rendering...</p>
            )}
          </div>
          
          <div className="chart-xaxis">
            {history.map((pt, idx) => (idx % 3 === 0 || idx === history.length - 1) && (
              <span key={idx} className="xaxis-label">{pt.month}</span>
            ))}
          </div>
        </motion.div>

        {/* Breakdown Summary Sidebar */}
        <motion.div 
          className="portfolio-summary-sidebar" 
          variants={cardItemVariants}
        >
          <div className="summary-val-box">
            <span>Net Asset Valuation</span>
            <h1>
              <CountUp end={totalValue || 0} prefix="₹" duration={1200} />
            </h1>
            <p><ShieldCheck size={14} /> Synchronized with PSB Security Twin</p>
          </div>

          <div className="allocation-list">
            <div className="allocation-item">
              <span>Financial Investments</span>
              <strong>₹{investments.reduce((acc, current) => acc + (current.amount || 0), 0).toLocaleString('en-IN')}</strong>
            </div>
            <div className="allocation-item">
              <span>Manual Tangible Assets</span>
              <strong>₹{assets.reduce((acc, current) => acc + (current.currentValue || 0), 0).toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Assets & Investments Details Grid */}
      <div className="assets-details-grid">
        
        {/* Manual Assets List */}
        <motion.div 
          className="portfolio-card assets-card" 
          variants={cardItemVariants}
        >
          <div className="panel-header-action">
            <h3>Manual Tangible Assets</h3>
            <button 
              className="btn btn-secondary btn-action-add"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={16} /> LOG ASSET
            </button>
          </div>

          <div className="asset-items-list">
            {assets.length > 0 ? (
              <div className="table-wrapper">
                <table className="portfolio-table">
                  <thead>
                    <tr>
                      <th>ASSET NAME</th>
                      <th>TYPE</th>
                      <th>VALUATION</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => (
                      <tr key={asset.id}>
                        <td>
                          <div className="table-cell-asset-name">
                            <span className="asset-cell-icon">{getAssetIcon(asset.type)}</span>
                            <span>{asset.name}</span>
                          </div>
                        </td>
                        <td><span className="badge-type">{asset.type}</span></td>
                        <td className="amount-cell">₹{asset.currentValue?.toLocaleString('en-IN')}</td>
                        <td>
                          <button 
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="btn-icon-delete"
                            title="Delete Asset"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-panel">
                <p>No manual assets logged. Log Property, Vehicles, or Gold holdings to map complete asset classes.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Financial Investments List */}
        <motion.div 
          className="portfolio-card investments-card" 
          variants={cardItemVariants}
        >
          <div className="panel-header-action">
            <h3>Active Financial Investments</h3>
          </div>

          <div className="investment-items-list">
            {investments.length > 0 ? (
              <div className="table-wrapper">
                <table className="portfolio-table">
                  <thead>
                    <tr>
                      <th>INSTRUMENT</th>
                      <th>TYPE</th>
                      <th>AMOUNT</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <div className="table-cell-asset-name">
                            <span className="asset-cell-icon invest-icon"><DollarSign size={16} /></span>
                            <span>{inv.name}</span>
                          </div>
                        </td>
                        <td><span className="badge-type">{inv.type}</span></td>
                        <td className="amount-cell">₹{inv.amount?.toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`badge-status ${inv.status?.toLowerCase() === 'active' ? 'active' : 'matured'}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-panel">
                <p>No active investments. Perform investment purchases in the Security Twin Sandbox to populate simulated wealth items.</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* Add Asset Modal Form */}
      {showAddForm && (
        <div className="asset-modal-overlay">
          <div className="asset-modal">
            <div className="modal-header">
              <h3>Log Tangible Asset</h3>
              <button className="btn-close-modal" onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddAsset} className="asset-form">
              <div className="form-group">
                <label>ASSET NAME</label>
                <input 
                  type="text" 
                  value={assetName} 
                  onChange={(e) => setAssetName(e.target.value)} 
                  placeholder="e.g. Residential Apartment"
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ASSET CLASS</label>
                  <select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
                    <option value="PROPERTY">PROPERTY (Real Estate)</option>
                    <option value="VEHICLE">VEHICLE (Car/Bike)</option>
                    <option value="GOLD">GOLD (Bullion/Jewelry)</option>
                    <option value="OTHER">OTHER TANGIBLES</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>CURRENT VALUATION (INR)</label>
                  <input 
                    type="number" 
                    value={assetValue} 
                    onChange={(e) => setAssetValue(e.target.value)} 
                    placeholder="₹ Value"
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>PURCHASE DATE</label>
                <input 
                  type="date" 
                  value={purchaseDate} 
                  onChange={(e) => setPurchaseDate(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>NOTES / AUDIT DETAILS</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="e.g. Registered market valuation under joint ownership."
                  rows="3"
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-submit-asset"
                disabled={submitting}
              >
                {submitting ? 'RECORDING VALUATION...' : 'LOG ASSET VALUATION'}
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Portfolio;
