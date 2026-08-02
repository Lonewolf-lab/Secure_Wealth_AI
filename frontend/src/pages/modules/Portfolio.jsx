import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  Building, 
  Car, 
  Coins, 
  Coins as OtherIcon, 
  DollarSign, 
  PlusCircle, 
  X,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import './Portfolio.css';

const Portfolio = () => {
  const { t } = useLanguage();
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
      setError(t('common.offline'));
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

      // Reset form & reload
      setAssetName('');
      setAssetType('PROPERTY');
      setAssetValue('');
      setPurchaseDate('');
      setNotes('');
      setShowAddForm(false);
      
      // Refresh portfolio details
      await fetchPortfolioData();
    } catch (err) {
      console.error('Failed to add manual asset', err);
      alert('Failed to log asset.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm(t('portfolio.confirmDelete'))) return;
    try {
      await api.delete(`/api/assets/${assetId}`);
      await fetchPortfolioData();
    } catch (err) {
      console.error('Failed to delete asset', err);
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
        <h3>{t('common.offline')}</h3>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={fetchPortfolioData}>
          {t('common.reconnect')}
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
    
    // Bottom points to close path
    const startX = padding;
    const endX = width - padding;
    return `${linePath} L ${endX} ${height} L ${startX} ${height} Z`;
  };

  const linePath = getChartPath();
  const fillPath = getChartFillPath(linePath);

  return (
    <div className="portfolio-content">
      {/* Chart & Summary Row */}
      <div className="portfolio-main-grid">
        
        {/* Net Worth Chart */}
        <div className="portfolio-card chart-card">
          <div className="chart-header-box">
            <div>
              <span>{t('portfolio.title')}</span>
              <h3>{t('portfolio.subTitle')}</h3>
            </div>
            <div className="compounding-tag">
              <TrendingUp size={14} /> {t('portfolio.compounded')}
            </div>
          </div>

          <div className="chart-display-container">
            {history.length > 1 ? (
              <svg className="svg-networth-chart" viewBox="0 0 500 150" width="100%" height="150">
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ff88" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#00ff88" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {/* Gradient area */}
                <path d={fillPath} fill="url(#chartGlow)" />
                {/* Glowing line */}
                <path d={linePath} fill="none" stroke="#00ff88" strokeWidth="3" strokeLinecap="round" />
                
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
                    <g key={idx} className="chart-marker-group">
                      <circle cx={x} cy={y} r="4" fill="#00ff88" className="marker-dot" />
                      <circle cx={x} cy={y} r="8" fill="#00ff88" opacity="0.2" className="marker-glow" />
                    </g>
                  );
                })}
              </svg>
            ) : (
              <p className="no-data-msg">{t('portfolio.valuationRendering')}</p>
            )}
          </div>
          
          <div className="chart-xaxis">
            {history.map((pt, idx) => (idx % 3 === 0 || idx === history.length - 1) && (
              <span key={idx} className="xaxis-label">{pt.month}</span>
            ))}
          </div>
        </div>

        {/* Breakdown Summary Sidebar */}
        <div className="portfolio-summary-sidebar">
          <div className="summary-val-box">
            <span>{t('portfolio.netValuation')}</span>
            <h1>₹{totalValue?.toLocaleString('en-IN') || '0'}</h1>
            <p><ShieldCheck size={14} /> {t('portfolio.syncTwin')}</p>
          </div>

          <div className="allocation-list">
            <div className="allocation-item">
              <span>{t('portfolio.financialInvestments')}</span>
              <strong>₹{investments.reduce((acc, current) => acc + (current.amount || 0), 0).toLocaleString('en-IN')}</strong>
            </div>
            <div className="allocation-item">
              <span>{t('portfolio.manualAssets')}</span>
              <strong>₹{assets.reduce((acc, current) => acc + (current.currentValue || 0), 0).toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Assets & Investments Details Grid */}
      <div className="assets-details-grid">
        
        {/* Manual Assets List */}
        <div className="portfolio-card assets-card">
          <div className="panel-header-action">
            <h3>{t('portfolio.tangibleAssets')}</h3>
            <button 
              className="btn btn-secondary btn-action-add"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={16} /> {t('portfolio.addAsset')}
            </button>
          </div>

          <div className="asset-items-list">
            {assets.length > 0 ? (
              <div className="table-wrapper">
                <table className="portfolio-table">
                  <thead>
                    <tr>
                      <th>{t('portfolio.assetName')}</th>
                      <th>{t('portfolio.category')}</th>
                      <th>{t('portfolio.estimatedValue')}</th>
                      <th>{t('common.status')}</th>
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
                            title={t('common.delete')}
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
                <p>{t('portfolio.noAssets')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Investments List */}
        <div className="portfolio-card investments-card">
          <div className="panel-header-action">
            <h3>{t('portfolio.activeInvestments')}</h3>
          </div>

          <div className="investment-items-list">
            {investments.length > 0 ? (
              <div className="table-wrapper">
                <table className="portfolio-table">
                  <thead>
                    <tr>
                      <th>{t('portfolio.assetName')}</th>
                      <th>{t('portfolio.category')}</th>
                      <th>{t('common.target')}</th>
                      <th>{t('common.status')}</th>
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
                            {inv.status === 'ACTIVE' ? t('common.active') : inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-panel">
                <p>{t('portfolio.noInvestments')}</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add Asset Modal Form */}
      {showAddForm && (
        <div className="asset-modal-overlay">
          <div className="asset-modal">
            <div className="modal-header">
              <h3>{t('portfolio.addAsset')}</h3>
              <button className="btn-close-modal" onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddAsset} className="asset-form">
              <div className="form-group">
                <label>{t('portfolio.assetName')}</label>
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
                  <label>{t('portfolio.category')}</label>
                  <select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
                    <option value="PROPERTY">{t('portfolio.property')}</option>
                    <option value="VEHICLE">{t('portfolio.vehicle')}</option>
                    <option value="GOLD">{t('portfolio.gold')}</option>
                    <option value="OTHER">{t('portfolio.other')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('portfolio.estimatedValue')}</label>
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
                <label>{t('portfolio.purchaseDate')}</label>
                <input 
                  type="date" 
                  value={purchaseDate} 
                  onChange={(e) => setPurchaseDate(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>{t('portfolio.notes')}</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Notes..."
                  rows="3"
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-submit-asset"
                disabled={submitting}
              >
                {submitting ? t('common.submitting') : t('portfolio.logAsset')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
