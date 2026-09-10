import { useState, useEffect } from 'react';
import ChatDemo from './components/ChatDemo';
import EvalPanel from './components/EvalPanel';
import AgentDashboard from './components/AgentDashboard';
import AdminDashboard from './components/AdminDashboard';

const API = 'http://localhost:3001';

export default function App() {
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

  const TABS = [
    { id: 'chat', label: '💬 User Dashboard', desc: 'Customer live support chat' },
    { id: 'admin', label: '🛡️ Admin Dashboard', desc: 'Human-in-the-Loop review queue', badge: pendingCount },
    { id: 'eval', label: '📊 Evaluation', desc: 'Metrics, baselines & judge scores' },
    { id: 'arch', label: '🏗️ Architecture', desc: 'Pipeline, intents & decisions' },
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">🍎</div>
          <div>
            <div className="header-title">Apple AI Support Agent</div>
            <div className="header-subtitle">Hiver SDE Intern Assignment · Dual Dashboards (User Chat + Admin Human Review)</div>
          </div>
        </div>

        <nav className="header-nav">
          {TABS.map(tab => (
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

        <div className="status-pill">
          <div className="status-dot" />
          <span>System Online</span>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {activeTab === 'chat' && <ChatDemo />}
        {activeTab === 'admin' && <AdminDashboard onTicketUpdate={setPendingCount} />}
        {activeTab === 'eval' && <EvalPanel />}
        {activeTab === 'arch' && <AgentDashboard />}
      </main>

      {/* Footer */}
      <footer style={{
        padding: '12px 32px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 12,
        color: 'var(--text-muted)',
      }}>
        <span>Apple AI Support Agent · Hiver SDE Intern Assignment · Built with Gemini + Express + React</span>
        <span>Dataset: Customer Support on Twitter (Kaggle) · Brand: Apple · Dual Dashboards · Human-in-the-Loop</span>
      </footer>
    </div>
  );
}
