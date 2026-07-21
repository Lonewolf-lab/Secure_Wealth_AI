import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  ShieldCheck, 
  Smartphone, 
  KeyRound, 
  Eye, 
  Play, 
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Plus,
  Info
} from 'lucide-react';
import './Security.css';

const Security = () => {
  // Trusted Devices State
  const [devices, setDevices] = useState([]);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [loadingDevices, setLoadingDevices] = useState(false);

  // OTP Simulator State
  const [actionType, setActionType] = useState('WITHDRAWAL');
  const [otpSentMsg, setOtpSentMsg] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Fraud Detection Form State
  const [amount, setAmount] = useState('150000');
  const [txType, setTxType] = useState('UPI');
  const [merchantCategory, setMerchantCategory] = useState('Jewelry');
  const [hour, setHour] = useState('3'); // 3 AM is risky
  const [dayOfWeek, setDayOfWeek] = useState('2'); // Wed
  const [isNewDevice, setIsNewDevice] = useState(1); // 1 = Yes
  const [isNewLocation, setIsNewLocation] = useState(1); // 1 = Yes
  const [distance, setDistance] = useState('850'); // 850 km away
  const [timeSinceLastTx, setTimeSinceLastTx] = useState('2'); // 2 minutes ago (high speed traversal!)
  const [fraudResult, setFraudResult] = useState(null);
  const [scanningFraud, setScanningFraud] = useState(false);

  // Audit Logs State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchDevices();
    fetchAuditLogs();
  }, []);

  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      const res = await api.get('/api/security/devices');
      setDevices(res || []);
    } catch (err) {
      console.error('Failed to fetch trusted devices', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      // Returns page wrapper: res.content holds items
      const res = await api.get('/api/security/log?page=0&size=10');
      setLogs(res?.content || []);
    } catch (err) {
      console.error('Failed to fetch security logs', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRegisterDevice = async (e) => {
    e.preventDefault();
    if (!newDeviceName) return;

    try {
      const randomId = 'dev_' + Math.random().toString(36).substr(2, 9);
      await api.post(`/api/security/trust-device?deviceId=${randomId}&deviceName=${encodeURIComponent(newDeviceName)}`);
      setNewDeviceName('');
      fetchDevices();
      fetchAuditLogs(); // updates log
    } catch (err) {
      console.error('Failed to register device', err);
      alert('Device registration failed.');
    }
  };

  const handleGenerateOtp = async () => {
    try {
      setOtpVerified(null);
      setOtpInput('');
      const res = await api.post(`/api/security/otp/generate?actionType=${actionType}`);
      setOtpSentMsg(res?.message || 'OTP simulated on terminal console.');
    } catch (err) {
      console.error('Failed to generate OTP', err);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput) return;

    setVerifyingOtp(true);
    try {
      const res = await api.post('/api/security/otp/verify', {
        otp: otpInput,
        actionType: actionType
      });
      setOtpVerified(res?.success === true);
      fetchAuditLogs(); // updates logs if challenged
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
      // Request mapped to FastAPI direct endpoint
      const response = await fetch('http://localhost:8000/api/detect-fraud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Transaction_Amount_INR: parseFloat(amount),
          Transaction_Type: txType,
          Merchant_Category: merchantCategory,
          Hour_of_Day: parseInt(hour),
          Day_of_Week: parseInt(dayOfWeek),
          Is_New_Device: parseInt(isNewDevice),
          Is_New_Location: parseInt(isNewLocation),
          Distance_From_Home_KM: parseFloat(distance),
          Account_Age_Days: 730, // seeded profile age
          Time_Since_Last_Transaction_Minutes: parseFloat(timeSinceLastTx)
        })
      });

      if (!response.ok) {
        throw new Error('Anomaly detector failed');
      }

      const data = await response.json();
      setFraudResult(data);

      // Log this event to our Spring backend audit log database if it's high risk!
      // This bridges the Python ML scanner directly to the PostgreSQL audit system!
      const riskLevelMap = { 'Low': 'ALLOW', 'Medium': 'WARN', 'High': 'BLOCK' };
      const eventDecision = riskLevelMap[data.risk_level] || 'ALLOW';

      // We can trigger log seeding on backend for this action
      await api.post('/api/security/log', {
        actionType: `SIMULATED_${txType}`,
        amount: parseFloat(amount),
        riskScore: data.risk_score,
        decision: eventDecision,
        details: `Simulated transaction to ${merchantCategory} from distance ${distance} km. Level: ${data.risk_level}`
      });

      fetchAuditLogs(); // refresh tables
    } catch (err) {
      console.error('Failed to scan transaction', err);
      alert('Anomaly scan server offline.');
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
            <h3>WPRS Real-Time Transaction Shield (FastAPI ML)</h3>
            <span className="shield-tag-active"><ShieldCheck size={14} /> Active Protection</span>
          </div>

          <div className="fraud-scanner-grid">
            <form onSubmit={handleScanTransaction} className="scanner-inputs-form">
              <div className="form-row">
                <div className="form-group">
                  <label>AMOUNT (INR)</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>TX TYPE</label>
                  <select value={txType} onChange={(e) => setTxType(e.target.value)}>
                    <option value="UPI">UPI TRANSFER</option>
                    <option value="NEFT">NEFT / RTGS</option>
                    <option value="Card Payment">CARD PAYMENT</option>
                    <option value="ATM Withdrawal">ATM WITHDRAWAL</option>
                    <option value="Wire Transfer">WIRE TRANSFER</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>MERCHANT CATEGORY</label>
                  <select value={merchantCategory} onChange={(e) => setMerchantCategory(e.target.value)}>
                    <option value="Grocery">Grocery</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Travel">Travel / Flights</option>
                    <option value="Utility Bills">Utility Bills</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Jewelry">Jewelry / Gold</option>
                    <option value="Cash Withdrawal">Cash Withdrawal</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>HOUR OF DAY (0-23)</label>
                  <input type="number" min="0" max="23" value={hour} onChange={(e) => setHour(e.target.value)} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>IS NEW DEVICE?</label>
                  <select value={isNewDevice} onChange={(e) => setIsNewDevice(parseInt(e.target.value))}>
                    <option value={0}>No (Recognized)</option>
                    <option value={1}>Yes (New Device)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>IS NEW LOCATION?</label>
                  <select value={isNewLocation} onChange={(e) => setIsNewLocation(parseInt(e.target.value))}>
                    <option value={0}>No (Recognized)</option>
                    <option value={1}>Yes (New Location)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>DISTANCE FROM HOME (KM)</label>
                  <input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>TIME SINCE LAST TX (MIN)</label>
                  <input type="number" value={timeSinceLastTx} onChange={(e) => setTimeSinceLastTx(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-scan-tx" disabled={scanningFraud}>
                <Activity size={16} className="pulse-icon" /> {scanningFraud ? 'ISOLATION FOREST SCANNING...' : 'SCAN TRANSACTION'}
              </button>
            </form>

            {/* Fraud Scan Result Pane */}
            <div className="scanner-results-pane">
              {fraudResult ? (
                <div className="fraud-scan-result-card">
                  <div className="result-header-row">
                    <span>SECURITY TWIN ANALYSIS</span>
                    <span className={`risk-badge-level ${fraudResult.risk_level.toLowerCase()}`}>
                      Risk: {fraudResult.risk_level}
                    </span>
                  </div>

                  <div className="risk-score-gauge-box">
                    <div className="gauge-score-value" style={{ 
                      color: fraudResult.risk_level === 'High' ? '#ff3366' : 
                             fraudResult.risk_level === 'Medium' ? '#ffb700' : '#00ff88' 
                    }}>
                      {fraudResult.risk_score}%
                    </div>
                    <span className="gauge-label">Vulnerability Index</span>
                  </div>

                  <div className="verdict-banner-box">
                    {fraudResult.is_anomaly ? (
                      <div className="verdict-warning">
                        <AlertTriangle size={20} />
                        <div>
                          <h5>SHIELD BLOCK INTERVENED</h5>
                          <p>Transaction flagged anomalous. High-velocity traveling traversal detected.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="verdict-success">
                        <CheckCircle size={20} />
                        <div>
                          <h5>TRANSACTION VERIFIED SAFE</h5>
                          <p>Biometrics, location, and device signatures are consistent with your baseline profile.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="audit-decision-indicator">
                    Spring Boot Twin Action: <strong style={{ 
                      color: fraudResult.risk_level === 'High' ? '#ff3366' : 
                             fraudResult.risk_level === 'Medium' ? '#ffb700' : '#00ff88' 
                    }}>
                      {fraudResult.risk_level === 'High' ? 'BLOCK' : 
                       fraudResult.risk_level === 'Medium' ? 'CHALLENGE (OTP)' : 'ALLOW'}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="empty-panel scan-placeholder">
                  <ShieldCheck size={32} />
                  <h5>WPRS Simulator</h5>
                  <p>Configure and scan a transaction to simulate the local Isolation Forest anomaly detection engine.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Middle Row: Devices & OTP Controls */}
      <div className="security-middle-grid">
        
        {/* Trusted Devices Register */}
        <div className="security-card devices-card">
          <div className="card-header-plain">
            <h3>Trusted Hardware Registry</h3>
            <span className="header-device-badge"><Smartphone size={16} /></span>
          </div>

          <form onSubmit={handleRegisterDevice} className="register-device-form">
            <div className="input-group-row">
              <input 
                type="text" 
                value={newDeviceName} 
                onChange={(e) => setNewDeviceName(e.target.value)} 
                placeholder="e.g. iPad Pro Office"
                required 
              />
              <button type="submit" className="btn btn-secondary btn-add-device">
                <Plus size={16} /> TRUST DEVICE
              </button>
            </div>
          </form>

          <div className="devices-list-wrapper">
            {loadingDevices ? (
              <p className="loading-advisor-msg">Reading registry...</p>
            ) : devices.length > 0 ? (
              <div className="devices-list">
                {devices.map((dev) => (
                  <div key={dev.id} className="device-item-card">
                    <div className="device-icon-box"><Smartphone size={18} /></div>
                    <div className="device-details">
                      <h5>{dev.deviceName}</h5>
                      <span>ID: {dev.deviceId}</span>
                    </div>
                    <span className="device-status-pill">TRUSTED</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-msg">No hardware tokens registered.</p>
            )}
          </div>
        </div>

        {/* Challenge Shield Simulator */}
        <div className="security-card challenge-card">
          <div className="card-header-plain">
            <h3>MFA OTP Simulation Portal</h3>
            <span className="header-device-badge"><KeyRound size={16} /></span>
          </div>

          <div className="otp-controls-container">
            <div className="form-group">
              <label>ACTION REQUIRING CHALLENGE</label>
              <div className="input-with-action">
                <select value={actionType} onChange={(e) => setActionType(e.target.value)}>
                  <option value="WITHDRAWAL">FUNDS WITHDRAWAL</option>
                  <option value="PASSWORD_CHANGE">PASSWORD RESET</option>
                  <option value="TRUST_NEW_DEVICE">TRUST NEW DEVICE</option>
                </select>
                <button type="button" onClick={handleGenerateOtp} className="btn btn-secondary btn-otp-gen">
                  SIMULATE CHALLENGE
                </button>
              </div>
            </div>

            {otpSentMsg && (
              <div className="otp-simulated-notification">
                <Info size={14} />
                <p>{otpSentMsg}</p>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="verify-otp-form">
              <div className="form-group">
                <label>INPUT SIMULATED VERIFICATION CODE</label>
                <div className="input-with-action">
                  <input 
                    type="text" 
                    value={otpInput} 
                    onChange={(e) => setOtpInput(e.target.value)} 
                    placeholder="Enter 6-digit code" 
                    required 
                  />
                  <button type="submit" className="btn btn-primary" disabled={verifyingOtp}>
                    {verifyingOtp ? 'CHECKING...' : 'VERIFY CODE'}
                  </button>
                </div>
              </div>
            </form>

            {otpVerified !== null && (
              <div className="otp-verification-result-box">
                {otpVerified ? (
                  <div className="otp-success">
                    <CheckCircle size={16} />
                    <span>MFA Verified. Transaction authorized.</span>
                  </div>
                ) : (
                  <div className="otp-failed">
                    <XCircle size={16} />
                    <span>Verification failed. Secure block maintained.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Lower Panel: Security Audit Logs */}
      <div className="security-card logs-card-box">
        <div className="card-header-plain">
          <h3>Security Audit Logs</h3>
          <button onClick={fetchAuditLogs} className="btn-refresh-logs">
            <RefreshCw size={16} /> Refresh logs
          </button>
        </div>

        <div className="logs-table-wrapper">
          {loadingLogs && logs.length === 0 ? (
            <p className="loading-advisor-msg">Retrieving syslog history...</p>
          ) : logs.length > 0 ? (
            <table className="logs-table">
              <thead>
                <tr>
                  <th>TIMESTAMP</th>
                  <th>ACTION TARGET</th>
                  <th>RISK RATING</th>
                  <th>SYSTEM DECISION</th>
                  <th>DIAGNOSTIC DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="log-timestamp-cell">
                        <Clock size={12} /> {new Date(log.timestamp).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td><strong>{log.actionType}</strong></td>
                    <td>
                       <span className="log-risk-val" style={{ 
                         color: (log.wprsScore || 0) >= 70 ? '#ff3366' : 
                                (log.wprsScore || 0) >= 30 ? '#ffb700' : '#00ff88' 
                       }}>
                         {log.wprsScore || 0}%
                       </span>
                     </td>
                     <td>
                       <span className={`log-decision-badge ${log.decision?.toLowerCase() || 'allow'}`}>
                         {log.decision}
                       </span>
                     </td>
                     <td className="log-details-cell">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-panel">
              <p>No audit events logged. Simulate transactions above to trigger security triggers.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Security;
