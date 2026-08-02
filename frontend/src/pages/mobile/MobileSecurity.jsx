import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Smartphone, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Activity,
  Key
} from 'lucide-react';

const MobileSecurity = ({ onTriggerFraud, onTriggerOTP }) => {
  const [wprsScore, setWprsScore] = useState(12);
  const [wprsDecision, setWprsDecision] = useState('ALLOW');
  const [activeSimulation, setActiveSimulation] = useState(null);

  const handleSimulateSafe = () => {
    setActiveSimulation('safe');
    setWprsScore(12);
    setWprsDecision('ALLOW');
  };

  const handleSimulateWarn = () => {
    setActiveSimulation('warn');
    setWprsScore(48);
    setWprsDecision('WARN');
    onTriggerOTP();
  };

  const handleSimulateBlock = () => {
    setActiveSimulation('block');
    setWprsScore(88);
    setWprsDecision('BLOCK');
    onTriggerFraud();
  };

  return (
    <div className="mobile-page-content">
      {/* Security Twin Status Gauge */}
      <motion.div 
        className={`mobile-card security-status-card ${wprsDecision.toLowerCase()}`}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="security-card-header">
          <div className="badge-wrapper">
            {wprsDecision === 'ALLOW' && <ShieldCheck size={28} color="#00ff88" />}
            {wprsDecision === 'WARN' && <AlertTriangle size={28} color="#ffb703" />}
            {wprsDecision === 'BLOCK' && <ShieldAlert size={28} color="#ff4d4d" />}
            <div>
              <h3>Security Twin WPRS</h3>
              <span className="subtitle">Wealth Protection Rating System</span>
            </div>
          </div>
          <div className={`wprs-score-bubble ${wprsDecision.toLowerCase()}`}>
            {wprsScore} / 100
          </div>
        </div>

        <div className="decision-banner">
          {wprsDecision === 'ALLOW' && (
            <div className="banner-status safe">
              <CheckCircle2 size={16} /> Status: <strong>ALLOW</strong> (Normal Cadence)
            </div>
          )}
          {wprsDecision === 'WARN' && (
            <div className="banner-status warning">
              <AlertTriangle size={16} /> Status: <strong>WARN</strong> (Step-Up Challenge Required)
            </div>
          )}
          {wprsDecision === 'BLOCK' && (
            <div className="banner-status danger">
              <XCircle size={16} /> Status: <strong>BLOCK</strong> (Forbidden High Risk)
            </div>
          )}
        </div>

        {/* Behavioral Metrics Grid */}
        <div className="behavior-metrics-grid">
          <div className="metric-box">
            <span className="metric-lbl">Device Trust</span>
            <span className="metric-val text-accent">VERIFIED</span>
          </div>
          <div className="metric-box">
            <span className="metric-lbl">Cadence Speed</span>
            <span className="metric-val">1.4s (Normal)</span>
          </div>
          <div className="metric-box">
            <span className="metric-lbl">Location Anomaly</span>
            <span className="metric-val">0% Deviation</span>
          </div>
          <div className="metric-box">
            <span className="metric-lbl">OTP Retry Count</span>
            <span className="metric-val">0 Retries</span>
          </div>
        </div>
      </motion.div>

      {/* Hackathon Demo Live Controls */}
      <div className="mobile-section-header">
        <h3>Hackathon Demo Controls</h3>
      </div>

      <div className="demo-controls-card">
        <p className="demo-desc">
          Test real-time WPRS interceptor responses for your presentation pitch:
        </p>

        <div className="demo-btn-group">
          <button 
            className={`demo-btn btn-safe ${activeSimulation === 'safe' ? 'active' : ''}`}
            onClick={handleSimulateSafe}
          >
            <ShieldCheck size={16} />
            <span>Normal Behavior (Allow)</span>
          </button>

          <button 
            className={`demo-btn btn-warn ${activeSimulation === 'warn' ? 'active' : ''}`}
            onClick={handleSimulateWarn}
          >
            <Key size={16} />
            <span>Step-Up OTP Challenge (Warn)</span>
          </button>

          <button 
            className={`demo-btn btn-block ${activeSimulation === 'block' ? 'active' : ''}`}
            onClick={handleSimulateBlock}
          >
            <ShieldAlert size={16} />
            <span>Fraud & Rogue Device (Block)</span>
          </button>
        </div>
      </div>

      {/* Trusted Devices Section */}
      <div className="mobile-section-header">
        <h3>Registered Devices</h3>
      </div>

      <div className="device-list">
        <div className="device-item active">
          <Smartphone size={20} className="device-icon" />
          <div className="device-info">
            <span className="device-name">iPhone 16 Pro (This Mobile Device)</span>
            <span className="device-meta">Fingerprint: fp-982a7f... • Active Now</span>
          </div>
          <span className="trusted-tag">Primary</span>
        </div>

        <div className="device-item">
          <Smartphone size={20} className="device-icon" />
          <div className="device-info">
            <span className="device-name">MacBook Pro Chrome (Web App)</span>
            <span className="device-meta">Fingerprint: fp-143c1b... • Last seen 2h ago</span>
          </div>
          <span className="trusted-tag muted">Trusted</span>
        </div>
      </div>
    </div>
  );
};

export default MobileSecurity;
