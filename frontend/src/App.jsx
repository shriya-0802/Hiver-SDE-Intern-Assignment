import { useState } from 'react';
import ChatDemo from './components/ChatDemo';
import EvalPanel from './components/EvalPanel';
import AgentDashboard from './components/AgentDashboard';

const TABS = [
  { id: 'chat', label: '💬 Live Demo', desc: 'Chat with the Apple AI agent' },
  { id: 'eval', label: '📊 Evaluation', desc: 'Metrics, baselines & judge scores' },
  { id: 'arch', label: '🏗️ Architecture', desc: 'Pipeline, intents & decisions' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">🍎</div>
          <div>
            <div className="header-title">Apple AI Support Agent</div>
            <div className="header-subtitle">Hiver SDE Intern Assignment · Gemini + RAG + 4-Tier Escalation</div>
          </div>
        </div>

        <nav className="header-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.desc}
            >
              {tab.label}
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
        <span>Apple AI Support Agent · Hiver SDE Intern Assignment · Built with Gemini-1.5-Flash + Express + React</span>
        <span>Dataset: Customer Support on Twitter (Kaggle) · Brand: Apple · 7 Intents · 4-Tier Escalation</span>
      </footer>
    </div>
  );
}
