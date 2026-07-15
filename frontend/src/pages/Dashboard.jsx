import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Wallet, 
  Target, 
  BrainCircuit, 
  ShieldAlert, 
  MessageSquareCode, 
  LogOut, 
  User as UserIcon,
  Activity,
  ChevronRight
} from 'lucide-react';
import Overview from './modules/Overview';
import Portfolio from './modules/Portfolio';
import './Dashboard.css';

// Lazy placehold subcomponents for future phases
const GoalsPlaceholder = () => (
  <div className="module-placeholder">
    <div className="pulse-circle"><Target size={32} /></div>
    <h3>Financial Goals (Phase 3)</h3>
    <p>Goal progress monitoring and Monte Carlo mathematical projections will be integrated in Phase 3.</p>
  </div>
);

const AIAdvisorPlaceholder = () => (
  <div className="module-placeholder">
    <div className="pulse-circle"><BrainCircuit size={32} /></div>
    <h3>AI Advisor & Optimizer (Phase 4)</h3>
    <p>Asset allocation classifiers, Mean-Variance rebalancing, and Prophet forecasts will be integrated in Phase 4.</p>
  </div>
);

const SecurityTwinPlaceholder = () => (
  <div className="module-placeholder">
    <div className="pulse-circle"><ShieldAlert size={32} /></div>
    <h3>Security Twin Sandbox (Phase 5)</h3>
    <p>WPRS transaction simulator and security audit logs will be integrated in Phase 5.</p>
  </div>
);

const ChatbotPlaceholder = () => (
  <div className="module-placeholder">
    <div className="pulse-circle"><MessageSquareCode size={32} /></div>
    <h3>AI Chat Assistant (Phase 6)</h3>
    <p>Local Ollama narrator and chat assistant will be integrated in Phase 6.</p>
  </div>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} />, component: <Overview /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Wallet size={20} />, component: <Portfolio /> },
    { id: 'goals', label: 'Goals', icon: <Target size={20} />, component: <GoalsPlaceholder /> },
    { id: 'advisor', label: 'AI Advisor', icon: <BrainCircuit size={20} />, component: <AIAdvisorPlaceholder /> },
    { id: 'security', label: 'Security Twin', icon: <ShieldAlert size={20} />, component: <SecurityTwinPlaceholder /> },
    { id: 'chat', label: 'AI Chatbot', icon: <MessageSquareCode size={20} />, component: <ChatbotPlaceholder /> },
  ];

  const renderActiveModule = () => {
    const item = navItems.find((x) => x.id === activeTab);
    return item ? item.component : <Overview />;
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <h2>SECUREWEALTH <span className="text-accent">AI</span></h2>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-item-btn ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {activeTab === item.id && <span className="nav-active-indicator"><ChevronRight size={16} /></span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="dashboard-workspace">
        <header className="workspace-header">
          <div className="header-title-box">
            <h1>{navItems.find((x) => x.id === activeTab)?.label}</h1>
            <p className="header-date"> Punjab & Sind Bank AI Wealth Portal</p>
          </div>

          {/* User Profile Info */}
          <div className="header-profile-box">
            <div className="profile-details">
              <span className="profile-name">{user?.name}</span>
              <span className="profile-role">{user?.role}</span>
            </div>
            <div className="profile-avatar">
              <UserIcon size={20} />
            </div>
          </div>
        </header>

        {/* Dynamic Module Panel */}
        <section className="workspace-panel">
          <div className="panel-inner">
            {renderActiveModule()}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
