import { useState, useEffect } from 'react';
import ChatDemo from './components/ChatDemo';
import EvalPanel from './components/EvalPanel';
import AgentDashboard from './components/AgentDashboard';
import AdminDashboard from './components/AdminDashboard';
import UserQueriesPanel from './components/UserQueriesPanel';
import LoginPage from './components/LoginPage';

const API = 'http://localhost:3001';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [pendingCount, setPendingCount] = useState(3);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const r = await fetch(`${API}/api/admin/tickets`).then(res => res.json());
        if (r.summary) setPendingCount(r.summary.pendingCount || 0);
      } catch (e) {}
    };
    fetchPending();
    const interval = setInterval(fetchPending, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('chat');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('chat');
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Define tabs based on logged-in role
  const userTabs = [
    { id: 'chat', label: '💬 Customer Live Chat', desc: 'Customer support interaction view' },
    { id: 'queries', label: '📋 My Queries & Evaluation', desc: 'View all user queries, evaluation scores & admin resolution status' },
    { id: 'eval', label: '📊 Evaluation Suite', desc: 'Metrics, baselines & judge scores' },
  ];

  const adminTabs = [
    { id: 'admin', label: '🛡️ Admin Review Queue', desc: 'Human-in-the-Loop review console', badge: pendingCount },
    { id: 'queries', label: '📋 User Queries & Status', desc: 'View all customer queries & evaluation percentages' },
    { id: 'eval', label: '📊 Evaluation Suite', desc: 'Metrics, baselines & judge scores' },
    { id: 'arch', label: '🏗️ Architecture Map', desc: 'Pipeline, intents & decisions' },
  ];

  const tabsToRender = currentUser.role === 'admin' ? adminTabs : userTabs;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">📱</div>
          <div>
            <div className="header-title">Apple AI Support Agent</div>
            <div className="header-subtitle">
              {currentUser.role === 'admin' ? '🛡️ Apple Admin Specialist Console' : '👤 Customer Support Portal'}
            </div>
          </div>
        </div>

        <nav className="header-nav">
          {tabsToRender.map(tab => (
            <button
              key={tab.id}
              className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.desc}
              style={{ position: 'relative' }}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span style={{
                  marginLeft: 6,
                  padding: '2px 6px',
                  borderRadius: 10,
                  background: 'var(--red)',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* User Profile Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 12px',
            background: currentUser.role === 'admin' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
            border: currentUser.role === 'admin' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(99,102,241,0.3)',
            borderRadius: 20,
            fontSize: 12
          }}>
            <span>{currentUser.role === 'admin' ? '🛡️' : '👤'}</span>
            <span style={{ fontWeight: 700, color: currentUser.role === 'admin' ? 'var(--yellow)' : 'var(--accent)' }}>
              {currentUser.name}
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '6px 12px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--red)',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}>
            🚪 Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {activeTab === 'chat' && currentUser.role === 'user' && <ChatDemo currentUser={currentUser} />}
        {activeTab === 'admin' && currentUser.role === 'admin' && <AdminDashboard onTicketUpdate={setPendingCount} />}
        {activeTab === 'queries' && <UserQueriesPanel />}
        {activeTab === 'eval' && <EvalPanel />}
        {activeTab === 'arch' && <AgentDashboard />}
      </main>
    </div>
  );
}
