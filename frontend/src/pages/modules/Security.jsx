import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Smartphone, 
  Key, 
  Fingerprint, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Plus
} from 'lucide-react';
import './Security.css';

const Security = () => {
  const { t } = useLanguage();
  const [devices, setDevices] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [amount, setAmount] = useState('250000');
  const [txType, setTxType] = useState('UPI');
  const [merchantCategory, setMerchantCategory] = useState('Crypto/Forex Exchange');
  const [hour, setHour] = useState('3');
  const [dayOfWeek, setDayOfWeek] = useState('6');
  const [isNewDevice, setIsNewDevice] = useState('1');
  const [isNewLocation, setIsNewLocation] = useState('1');
  const [distance, setDistance] = useState('1450');
  const [timeSinceLastTx, setTimeSinceLastTx] = useState('2');

  const [fraudResult, setFraudResult] = useState(null);
  const [scanningFraud, setScanningFraud] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    fetchDevices();
    fetchAuditLogs();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/api/security/devices');
      setDevices(res || []);
    } catch (err) {
      console.error('Failed to fetch devices', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoadingData(true);
      const res = await api.get('/api/security/logs');
      setAuditLogs(res || []);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleRevokeDevice = async (deviceId) => {
    try {
      await api.delete(`/api/security/devices/${deviceId}`);
      await fetchDevices();
    } catch (err) {
      console.error('Failed to revoke device', err);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput) return;

    try {
      setVerifyingOtp(true);
      const res = await api.post('/api/otp/verify', { otp: otpInput });
      if (res && res.verified) {
        setOtpVerified(true);
        setTimeout(() => {
          setShowOtpModal(false);
          setOtpVerified(false);
          setOtpInput('');
        }, 1500);
      } else {
        alert('Invalid OTP.');
      }
    } catch (err) {
      console.error('Failed to verify OTP', err);
      setOtpVerified(false);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleScanTransaction = async (e) => {
    e.preventDefault();
    setScanningFraud(true);
    try {
      const response = await fetch('http://localhost:8000/api/detect-fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Transaction_Amount_INR: parseFloat(amount),
          Transaction_Type: txType,
          Merchant_Category: merchantCategory,
          Hour_of_Day: parseInt(hour),
          Day_of_Week: parseInt(dayOfWeek),
          Is_New_Device: parseInt(isNewDevice),
          Is_New_Location: parseInt(isNewLocation),
          Distance_From_Home_KM: parseFloat(distance),
          Account_Age_Days: 730,
          Time_Since_Last_Transaction_Minutes: parseFloat(timeSinceLastTx)
        })
      });

      if (!response.ok) throw new Error('Anomaly detector failed');
      const data = await response.json();
      setFraudResult(data);

      const riskLevelMap = { 'Low': 'ALLOW', 'Medium': 'WARN', 'High': 'BLOCK' };
      const eventDecision = riskLevelMap[data.risk_level] || 'ALLOW';

      await api.post('/api/security/log', {
        actionType: `SIMULATED_${txType}`,
        amount: parseFloat(amount),
        riskScore: data.risk_score,
        decision: eventDecision,
        details: `Simulated transaction to ${merchantCategory} from distance ${distance} km. Level: ${data.risk_level}`
      });

      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to scan transaction', err);
    } finally {
      setScanningFraud(false);
    }
  };

  return (
    <div className="security-content-wrapper">
      
      {/* Upper Grid: WPRS Shield Simulator & Devices */}
      <div className="security-grid-upper">
        
        {/* Real-time transaction Biometrics Scanner */}
        <div className="security-card fraud-scanner-box">
          <div className="card-header-plain">
            <h3>{t('security.wprsTitle')}</h3>
            <span className="shield-tag-active"><ShieldCheck size={14} /> {t('common.safe')}</span>
          </div>

          <div className="fraud-scanner-grid">
            <form onSubmit={handleScanTransaction} className="scanner-inputs-form">
              <div className="form-row">
                <div className="form-group">
                  <label>{t('security.enterOtp')}</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>HOUR OF DAY (0-23)</label>
                  <input type="number" min="0" max="23" value={hour} onChange={(e) => setHour(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-scan-execute" disabled={scanningFraud}>
                {scanningFraud ? t('common.loading') : t('security.threatGauge')}
              </button>
            </form>
          </div>
        </div>

        {/* Registered Devices Panel */}
        <div className="security-card devices-card">
          <div className="card-header-plain">
            <h3>{t('security.registeredDevices')}</h3>
          </div>

          <div className="devices-list">
            {devices.length > 0 ? (
              devices.map((dev) => (
                <div key={dev.id} className="device-item-card">
                  <div className="device-icon-box"><Smartphone size={20} /></div>
                  <div className="device-details">
                    <h4>{dev.deviceName}</h4>
                    <span className="device-status">{dev.isTrusted ? t('common.trusted') : 'Untrusted'}</span>
                  </div>
                  {!dev.isTrusted && (
                    <button onClick={() => handleRevokeDevice(dev.id)} className="btn-revoke">{t('common.remove')}</button>
                  )}
                </div>
              ))
            ) : (
              <p className="no-data-msg">{t('common.noData')}</p>
            )}
          </div>
        </div>

      </div>

      {/* OTP Step-Up Verification Modal */}
      {showOtpModal && (
        <div className="asset-modal-overlay">
          <div className="asset-modal otp-modal">
            <div className="modal-header">
              <h3>{t('security.otpModalTitle')}</h3>
              <button className="btn-close-modal" onClick={() => setShowOtpModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleVerifyOtp} className="asset-form">
              <p className="otp-modal-sub">{t('security.otpModalSub')}</p>
              
              <div className="form-group">
                <label>{t('security.enterOtp')}</label>
                <input 
                  type="text" 
                  value={otpInput} 
                  onChange={(e) => setOtpInput(e.target.value)} 
                  placeholder="123456" 
                  maxLength={6}
                  required 
                />
              </div>

              {otpVerified && <div className="success-banner">{t('common.verified')}</div>}

              <button type="submit" className="btn btn-primary btn-submit-asset" disabled={verifyingOtp}>
                {verifyingOtp ? t('common.loading') : t('security.verifyBtn')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Security;
