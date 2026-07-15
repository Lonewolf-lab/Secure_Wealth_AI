import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  HelpCircle, 
  Play, 
  CheckCircle, 
  ChevronRight,
  Shield,
  Activity,
  X
} from 'lucide-react';
import './Goals.css';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Selected Goal for Projections
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [projection, setProjection] = useState(null);
  const [loadingProj, setLoadingProj] = useState(false);

  // Add Goal Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmt, setTargetAmt] = useState('');
  const [savedAmt, setSavedAmt] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('RETIREMENT');
  const [savingGoal, setSavingGoal] = useState(false);

  // What-If Simulator State
  const [scenarioName, setScenarioName] = useState('My SIP Compounding');
  const [simulateAmount, setSimulateAmount] = useState('50000');
  const [simulateType, setSimulateType] = useState('START_SIP');
  const [selectedSimGoalId, setSelectedSimGoalId] = useState('');
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/goals');
      setGoals(res || []);
      if (res && res.length > 0) {
        // Auto-select first goal for projections
        handleSelectGoal(res[0]);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load goals', err);
      setError('Unable to fetch goal milestones. Verify connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSelectGoal = async (goal) => {
    setSelectedGoal(goal);
    setLoadingProj(true);
    try {
      const res = await api.get(`/api/goals/${goal.id}/projection`);
      setProjection(res);
    } catch (err) {
      console.error('Failed to fetch goal projection', err);
      setProjection(null);
    } finally {
      setLoadingProj(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalName || !targetAmt || !savedAmt || !deadline) return;

    try {
      setSavingGoal(true);
      const newGoal = await api.post('/api/goals', {
        name: goalName,
        targetAmount: parseFloat(targetAmt),
        currentSaved: parseFloat(savedAmt),
        deadline: deadline,
        category: category
      });

      // Clear & Close
      setGoalName('');
      setTargetAmt('');
      setSavedAmt('');
      setDeadline('');
      setCategory('RETIREMENT');
      setShowAddForm(false);

      // Refresh list
      const res = await api.get('/api/goals');
      setGoals(res || []);
      // Select the newly created goal
      if (newGoal) {
        handleSelectGoal(newGoal);
      }
    } catch (err) {
      console.error('Failed to save goal', err);
      alert('Failed to save financial goal.');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleRunSimulation = async (e) => {
    e.preventDefault();
    setSimulating(true);
    try {
      const payload = {
        scenarioName,
        amount: parseFloat(simulateAmount),
        type: simulateType,
      };
      if (selectedSimGoalId) {
        payload.goalId = parseInt(selectedSimGoalId);
      }
      const res = await api.post('/api/simulator/what-if', payload);
      setSimResult(res);
    } catch (err) {
      console.error('Failed to run simulation', err);
      alert('Simulation error.');
    } finally {
      setSimulating(false);
    }
  };

  if (loading && goals.length === 0) {
    return (
      <div className="goals-loading">
        <div className="skeleton-line title"></div>
        <div className="skeleton-grid-goals">
          <div className="skeleton-box large"></div>
          <div className="skeleton-box small"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="goals-error">
        <h3>Connection offline</h3>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={fetchGoals}>RELOAD MILESTONES</button>
      </div>
    );
  }

  return (
    <div className="goals-content-wrapper">
      
      {/* Upper Section: Goals List & Details Projection Panel */}
      <div className="goals-main-grid">
        
        {/* Left: Goals milestones list */}
        <div className="goals-list-card">
          <div className="card-header-action">
            <h3>Milestone Targets</h3>
            <button className="btn btn-secondary btn-log-goal" onClick={() => setShowAddForm(true)}>
              <Plus size={16} /> ADD TARGET
            </button>
          </div>

          <div className="goals-vertical-scroll">
            {goals.length > 0 ? (
              <div className="goals-cards-list">
                {goals.map((g) => {
                  const pct = Math.min(100, Math.max(0, (g.currentSaved / g.targetAmount) * 100));
                  const isActive = selectedGoal?.id === g.id;

                  return (
                    <div 
                      key={g.id} 
                      className={`goal-item-card ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectGoal(g)}
                    >
                      <div className="goal-card-top">
                        <div className="goal-icon-label">
                          <span className="goal-card-bullet"></span>
                          <h4>{g.name}</h4>
                        </div>
                        <span className="goal-card-tag">{g.category}</span>
                      </div>

                      <div className="goal-card-progress-box">
                        <div className="progress-info-row">
                          <span>Progress</span>
                          <strong>{pct.toFixed(0)}%</strong>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="progress-amounts-row">
                          <span>₹{g.currentSaved?.toLocaleString('en-IN')}</span>
                          <span>Target: ₹{g.targetAmount?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="goal-card-date">
                        <Calendar size={12} /> Target Date: {new Date(g.deadline).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-panel">
                <p>No milestones created yet. Set up targets like Retirement Corpus or Home Downpayment to map projections.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Projection Details */}
        <div className="goals-projection-card">
          <div className="card-header-plain">
            <h3>AI Goal Projection Pathway</h3>
          </div>

          {selectedGoal ? (
            <div className="projection-details-panel">
              <div className="selected-goal-meta">
                <h4>{selectedGoal.name}</h4>
                <p>Calculated projection from current assets & compounding vectors</p>
              </div>

              {loadingProj ? (
                <div className="projection-loading-spinner">
                  <div className="spinner"></div>
                  <p>Processing compound path...</p>
                </div>
              ) : projection ? (
                <div className="projection-info-box">
                  <div className="projection-metrics-grid">
                    <div className="proj-metric-item">
                      <span>PROJECTED CORPUS</span>
                      <h3>₹{projection.projectedAmountAtDeadline?.toLocaleString('en-IN') || '0'}</h3>
                    </div>
                    <div className="proj-metric-item">
                      <span>FORECAST STATUS</span>
                      <h3 className="status-on-track" style={{ color: projection.status === 'ON_TRACK' ? '#00ff88' : '#ffb700' }}>
                        {projection.status?.replace('_', ' ')}
                      </h3>
                    </div>
                  </div>

                  <div className="projection-suggestion-card">
                    <div className="suggestion-icon-box"><Sparkles size={20} /></div>
                    <div className="suggestion-text">
                      <h5>Twin Recommendation</h5>
                      <p>{projection.suggestion}</p>
                    </div>
                  </div>

                  {/* Compounding Pathway Details */}
                  <div className="compounding-pathway-visual">
                    <div className="path-row start">
                      <div className="path-node current"></div>
                      <div className="path-node-text">
                        <span>Today</span>
                        <strong>₹{selectedGoal.currentSaved?.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                    
                    <div className="path-connector"></div>

                    <div className="path-row end">
                      <div className="path-node target"></div>
                      <div className="path-node-text">
                        <span>Deadline ({new Date(selectedGoal.deadline).getFullYear()})</span>
                        <strong>₹{projection.projectedAmountAtDeadline?.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="projection-disclaimer">
                    *Assumes a compounding rate of 12% per annum on equity assets and 7% on debt investments.
                  </div>
                </div>
              ) : (
                <p className="no-data-msg">No projection mapping returned.</p>
              )}
            </div>
          ) : (
            <div className="empty-panel select-prompt">
              <Activity size={32} className="pulse-icon" />
              <p>Select a milestone card on the left to review its future compounding pathway projections.</p>
            </div>
          )}
        </div>

      </div>

      {/* Lower Section: What-If Monte Carlo Simulator */}
      <div className="simulator-card-box">
        <div className="card-header-plain">
          <h3>Monte Carlo What-If Simulation Sandbox</h3>
          <span className="subtitle-tag"><Shield size={14} /> Deterministic Compounding</span>
        </div>

        <div className="simulator-grid">
          {/* Controls Form */}
          <form onSubmit={handleRunSimulation} className="simulator-controls-form">
            <div className="form-group">
              <label>SCENARIO NAME</label>
              <input 
                type="text" 
                value={scenarioName} 
                onChange={(e) => setScenarioName(e.target.value)} 
                placeholder="e.g. SIP Compounding" 
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>SIMULATION TYPE</label>
                <select value={simulateType} onChange={(e) => setSimulateType(e.target.value)}>
                  <option value="START_SIP">START MONTHLY SIP</option>
                  <option value="BUY_ASSET">BUY LUMP-SUM ASSET</option>
                  <option value="WITHDRAW">WITHDRAW FUNDS</option>
                </select>
              </div>

              <div className="form-group">
                <label>AMOUNT (INR)</label>
                <input 
                  type="number" 
                  value={simulateAmount} 
                  onChange={(e) => setSimulateAmount(e.target.value)} 
                  placeholder="₹ Amount" 
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>LINKED TARGET GOAL (OPTIONAL)</label>
              <select value={selectedSimGoalId} onChange={(e) => setSelectedSimGoalId(e.target.value)}>
                <option value="">No goal association</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-run-sim" disabled={simulating}>
              <Play size={16} fill="#000" /> {simulating ? 'COMPUTING SIMULATIONS...' : 'RUN MONTE CARLO'}
            </button>
          </form>

          {/* Results Output Pane */}
          <div className="simulator-results-panel">
            {simResult ? (
              <div className="sim-results-output">
                <div className="sim-summary-header">
                  <div className="sim-success-badge">
                    <CheckCircle size={18} />
                    <span>SUCCESS PROBABILITY</span>
                    <strong>{simResult.successProbability}%</strong>
                  </div>
                </div>

                <div className="sim-projections-table-wrapper">
                  <table className="sim-table">
                    <thead>
                      <tr>
                        <th>YEARS</th>
                        <th>P10 (PESSIMISTIC)</th>
                        <th>P50 (MEDIAN)</th>
                        <th>P90 (OPTIMISTIC)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simResult.projectedNetWorth?.map((row, idx) => (
                        <tr key={idx}>
                          <td><strong>{row.year} Years</strong></td>
                          <td>₹{row.p10?.toLocaleString('en-IN')}</td>
                          <td className="median-cell">₹{row.p50?.toLocaleString('en-IN')}</td>
                          <td>₹{row.p90?.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="sim-verdict-note">
                  *Based on 1,000 simulated iterations at 12% average returns and 8% standard deviation.
                </p>
              </div>
            ) : (
              <div className="empty-panel sim-placeholder">
                <HelpCircle size={32} />
                <h5>Simulation Results</h5>
                <p>Run the Monte Carlo solver to project future net worth compounding ranges under the selected scenario variables.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showAddForm && (
        <div className="goal-modal-overlay">
          <div className="goal-modal">
            <div className="modal-header">
              <h3>Configure Milestone Target</h3>
              <button className="btn-close-modal" onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateGoal} className="goal-form">
              <div className="form-group">
                <label>MILESTONE NAME</label>
                <input 
                  type="text" 
                  value={goalName} 
                  onChange={(e) => setGoalName(e.target.value)} 
                  placeholder="e.g. Retirement Corpus or Home Fund"
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>GOAL CATEGORY</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="RETIREMENT">RETIREMENT</option>
                    <option value="HOME">HOME DOWNPAYMENT</option>
                    <option value="EDUCATION">CHILD EDUCATION</option>
                    <option value="VEHICLE">VEHICLE PURCHASE</option>
                    <option value="TRAVEL">VACATION / TRAVEL</option>
                    <option value="OTHER">OTHER TARGET</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>TARGET VALUE (INR)</label>
                  <input 
                    type="number" 
                    value={targetAmt} 
                    onChange={(e) => setTargetAmt(e.target.value)} 
                    placeholder="₹ Target Amount"
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>CURRENT SAVED AMOUNT (INR)</label>
                  <input 
                    type="number" 
                    value={savedAmt} 
                    onChange={(e) => setSavedAmt(e.target.value)} 
                    placeholder="₹ Initial Saved"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>TARGET DEADLINE</label>
                  <input 
                    type="date" 
                    value={deadline} 
                    onChange={(e) => setDeadline(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-submit-goal"
                disabled={savingGoal}
              >
                {savingGoal ? 'SAVING CONFIGURATION...' : 'CREATE TARGET MILESTONE'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Goals;
