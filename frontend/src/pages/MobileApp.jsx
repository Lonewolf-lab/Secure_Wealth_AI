import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import { 
  LayoutDashboard, 
  Wallet, 
  BrainCircuit, 
  ShieldAlert, 
  MessageSquareCode, 
  Smartphone, 
  Monitor, 
  Wifi, 
  BatteryCharging, 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  Lock, 
  CheckCircle2,
  Sparkles,
  Fingerprint
} from 'lucide-react';

import MobileHome from './mobile/MobileHome';
import MobilePortfolio from './mobile/MobilePortfolio';
import MobileSecurity from './mobile/MobileSecurity';
import MobileAITwin from './mobile/MobileAITwin';
import MobileChat from './mobile/MobileChat';

import './MobileApp.css';

const MobileApp = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('home');
  const [isDeviceFrame, setIsDeviceFrame] = useState(true);
  const [currentTime, setCurrentTime] = useState('09:41');

  // Hackathon Demo Overlays
  const [showFraudModal, setShowFraudModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  // Time updater
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyOTP = () => {
    setOtpVerified(true);
    setTimeout(() => {
      setOtpVerified(false);
      setShowOTPModal(false);
      setOtpCode('');
    }, 1500);
  };

  const navItems = [
    { id: 'home', label: t('nav.home'), icon: <LayoutDashboard size={20} /> },
    { id: 'portfolio', label: t('nav.portfolio'), icon: <Wallet size={20} /> },
    { id: 'advisor', label: t('nav.advisor'), icon: <BrainCircuit size={20} /> },
    { id: 'security', label: t('nav.security'), icon: <ShieldAlert size={20} /> },
    { id: 'chat', label: t('nav.assistant'), icon: <MessageSquareCode size={20} /> },
  ];

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <MobileHome 
            onNavigate={setActiveTab} 
            onTriggerFraud={() => setShowFraudModal(true)} 
            onTriggerOTP={() => setShowOTPModal(true)} 
          />
        );
      case 'portfolio':
        return <MobilePortfolio />;
      case 'security':
        return (
          <MobileSecurity 
            onTriggerFraud={() => setShowFraudModal(true)} 
            onTriggerOTP={() => setShowOTPModal(true)} 
          />
        );
      case 'advisor':
        return <MobileAITwin onNavigate={setActiveTab} />;
      case 'chat':
        return <MobileChat />;
      default:
        return <MobileHome onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className={`mobile-wrapper-outer ${isDeviceFrame ? 'frame-mode' : 'fullscreen-mode'}`}>
      {/* Hackathon Top Presentation Control Bar */}
      <header className="hackathon-presentation-bar">
        <div className="presentation-title">
          <Sparkles size={16} color="#00ff88" />
          <span>PSB Hackathon Mobile Presentation</span>
        </div>

        <div className="presentation-actions">
          <LanguageSelector compact={true} />

          <button 
            className="demo-trigger-btn danger" 
            onClick={() => setShowFraudModal(true)}
            title="Simulate High-Risk Transaction (WPRS > 60)"
          >
            <ShieldAlert size={14} /> {t('home.simulateFraud')}
          </button>

          <button 
            className="demo-trigger-btn warning" 
            onClick={() => setShowOTPModal(true)}
            title="Simulate Step-Up OTP Verification"
          >
            <Lock size={14} /> {t('home.testStepUp')}
          </button>

          <button 
            className="mode-toggle-btn"
            onClick={() => setIsDeviceFrame(!isDeviceFrame)}
          >
            {isDeviceFrame ? <Monitor size={14} /> : <Smartphone size={14} />}
            {isDeviceFrame ? 'Full Screen' : 'Frame View'}
          </button>

          <button 
            className="back-desktop-btn"
            onClick={() => navigate('/dashboard')}
          >
            Portal ➔
          </button>
        </div>
      </header>

      {/* Smartphone Container */}
      <div className={`smartphone-device ${isDeviceFrame ? 'with-frame' : 'no-frame'}`}>
        {/* Dynamic Island / Notch */}
        {isDeviceFrame && (
          <div className="dynamic-island">
            <div className="camera-lens"></div>
            <div className="speaker-grille"></div>
          </div>
        )}

        {/* Status Bar */}
        <div className="phone-status-bar">
          <span className="status-time">{currentTime}</span>
          <div className="status-icons">
            <span className="status-badge"><ShieldCheck size={12} /> WPRS Active</span>
            <Wifi size={14} />
            <BatteryCharging size={14} />
          </div>
        </div>

        {/* Mobile Header Bar */}
        <div className="phone-app-header">
          <div className="app-brand">
            <span className="brand-psb">PSB</span>
            <span className="brand-title">SecureWealth <span className="text-accent">AI</span></span>
          </div>
          <div className="user-profile-badge" onClick={() => setActiveTab('security')}>
            <span className="user-avatar">V</span>
            <span className="shield-dot safe"></span>
          </div>
        </div>

        {/* Main Viewport Content */}
        <main className="phone-main-viewport">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="viewport-motion-wrapper"
            >
              {renderActiveTabContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="phone-bottom-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-tab-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="tab-icon-wrapper">{item.icon}</div>
              <span className="tab-label">{item.label}</span>
              {activeTab === item.id && (
                <motion.div className="active-glow-bar" layoutId="activeTabGlow" />
              )}
            </button>
          ))}
        </nav>

        {/* Home Indicator Bar */}
        {isDeviceFrame && <div className="home-indicator"></div>}
      </div>

      {/* OVERLAY MODAL 1: Fraud Threat Intercepted (WPRS > 60 BLOCK) */}
      <AnimatePresence>
        {showFraudModal && (
          <div className="hackathon-modal-backdrop" onClick={() => setShowFraudModal(false)}>
            <motion.div 
              className="fraud-threat-modal"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-alert-header">
                <ShieldAlert size={48} color="#ff4d4d" className="pulse-danger" />
                <h3>TRANSACTION INTERCEPTED</h3>
                <span className="wprs-threat-badge">WPRS Score: 88/100 (HIGH RISK)</span>
              </div>

              <div className="modal-alert-body">
                <p>The <strong>PSB Security Twin Interceptor</strong> blocked an unauthorized high-value transfer.</p>
                <div className="risk-details-box">
                  <div className="risk-row">
                    <span>Target Amount:</span> <strong>₹2,50,000 INR</strong>
                  </div>
                  <div className="risk-row">
                    <span>Device Status:</span> <span className="danger-text">Unrecognized IP / Device</span>
                  </div>
                  <div className="risk-row">
                    <span>Behavior Anomaly:</span> <span className="danger-text">Action Speed &lt; 0.3s (Bot)</span>
                  </div>
                  <div className="risk-row">
                    <span>WPRS Action:</span> <strong className="blocked-text">BLOCK (HTTP 403 Forbidden)</strong>
                  </div>
                </div>
              </div>

              <div className="modal-action-footer">
                <button className="dismiss-alert-btn" onClick={() => setShowFraudModal(false)}>
                  Close Security Intercept
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY MODAL 2: Step-Up OTP Verification */}
      <AnimatePresence>
        {showOTPModal && (
          <div className="hackathon-modal-backdrop" onClick={() => setShowOTPModal(false)}>
            <motion.div 
              className="otp-verify-modal"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="otp-header">
                <Lock size={32} color="#00ff88" />
                <h3>Step-Up Biometric Authentication</h3>
                <p>WPRS Rating: 48 (WARN). Please confirm session via OTP.</p>
              </div>

              {otpVerified ? (
                <div className="otp-verified-state">
                  <CheckCircle2 size={56} color="#00ff88" />
                  <h4>Biometric Verified!</h4>
                  <p>Transaction Authorized safely.</p>
                </div>
              ) : (
                <>
                  <div className="otp-inputs-row">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength="1"
                        className="otp-digit-box"
                        value={otpCode[i - 1] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOtpCode((prev) => prev + val);
                        }}
                      />
                    ))}
                  </div>

                  <div className="biometric-touch-sim" onClick={handleVerifyOTP}>
                    <Fingerprint size={40} className="pulse-fp" />
                    <span>Touch Fingerprint Sensor to Verify</span>
                  </div>

                  <div className="otp-modal-buttons">
                    <button className="otp-cancel-btn" onClick={() => setShowOTPModal(false)}>
                      Cancel
                    </button>
                    <button className="otp-confirm-btn" onClick={handleVerifyOTP}>
                      Verify & Proceed
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

export default MobileApp;
