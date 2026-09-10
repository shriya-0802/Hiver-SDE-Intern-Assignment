import { useState, useEffect } from 'react';

const API = 'http://localhost:3001';

const INTENT_COLORS = {
  SOFTWARE_BUG: '#8b5cf6',
  DEVICE_ISSUE: '#06b6d4',
  ACCOUNT_ACCESS: '#f59e0b',
  BILLING_PAYMENT: '#10b981',
  SERVICE_OUTAGE: '#ef4444',
  REPAIR_WARRANTY: '#f97316',
  GENERAL_INQUIRY: '#6366f1',
};

export default function UserQueriesPanel() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchQueries = async () => {
    try {
      const res = await fetch(`${API}/api/agent/user-queries`).then(r => r.json());
      if (res.queries) {
        setQueries(res.queries);
      }
    } catch (err) {
      console.error('Error fetching user queries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
    const interval = setInterval(fetchQueries, 3000); // Live poll for admin resolution updates
    return () => clearInterval(interval);
  }, []);

  const filteredQueries = queries.filter(q => {
    if (filter === 'AUTO' && !q.isAutoResolved) return false;
    if (filter === 'ADMIN' && !q.isResolvedByAdmin) return false;
    if (filter === 'PENDING' && !q.isPendingAdmin) return false;

    if (search.trim()) {
      const term = search.toLowerCase();
      return q.message.toLowerCase().includes(term) ||
             q.intent.toLowerCase().includes(term) ||
             q.id.toLowerCase().includes(term);
    }
    return true;
  });

  const totalCount = queries.length;
  const autoCount = queries.filter(q => q.isAutoResolved).length;
  const adminCount = queries.filter(q => q.isResolvedByAdmin).length;
  const pendingCount = queries.filter(q => q.isPendingAdmin).length;
  const avgScore = totalCount > 0
    ? Math.round(queries.reduce((acc, q) => acc + (q.evalScorePct || 85), 0) / totalCount)
    : 85;

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear all previous queries?')) return;
    try {
      await fetch(`${API}/api/agent/clear-queries`, { method: 'POST' });
      fetchQueries();
    } catch (e) {
      console.error('Error clearing queries:', e);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div>Loading your queries & evaluation status…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span className="glow-text">My Queries & Evaluation Status</span>
          </h2>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Track real-time evaluation scores, AI confidence, and Admin resolution status for all your customer support queries.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleClear}
            style={{
              padding: '8px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius)',
              color: 'var(--red)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
            🗑️ Clear History
          </button>
          <button
            onClick={fetchQueries}
            style={{
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
            🔄 Refresh Status
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <div className="metric-card">
          <div className="metric-value">{totalCount}</div>
          <div className="metric-label">Total Queries</div>
        </div>
        <div className="metric-card">
          <div className="metric-value" style={{ color: 'var(--green)' }}>{avgScore}%</div>
          <div className="metric-label">Avg Eval Score</div>
        </div>
        <div className="metric-card">
          <div className="metric-value" style={{ color: '#22c55e' }}>{autoCount}</div>
          <div className="metric-label">🤖 Auto-Resolved</div>
        </div>
        <div className="metric-card">
          <div className="metric-value" style={{ color: 'var(--accent)' }}>{adminCount}</div>
          <div className="metric-label">🛡️ Admin Resolved</div>
        </div>
        <div className="metric-card">
          <div className="metric-value" style={{ color: 'var(--yellow)' }}>{pendingCount}</div>
          <div className="metric-label">⏳ Pending Admin</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'ALL', label: `All Queries (${totalCount})` },
            { id: 'AUTO', label: `🤖 Auto-Resolved (${autoCount})` },
            { id: 'ADMIN', label: `🛡️ Admin Resolved (${adminCount})` },
            { id: 'PENDING', label: `⏳ Pending Admin (${pendingCount})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                border: filter === f.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: filter === f.id ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)',
                color: filter === f.id ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}>
              {f.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="🔍 Search query text or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '7px 12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-primary)',
            fontSize: 12,
            width: 220
          }}
        />
      </div>

      {/* Queries List */}
      {filteredQueries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div>No customer queries found matching your filter.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredQueries.map(q => {
            const intentColor = INTENT_COLORS[q.intent] || 'var(--accent)';
            const formattedTime = new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={q.id} className="card" style={{
                borderLeft: `4px solid ${q.isResolvedByAdmin ? 'var(--accent)' : q.isAutoResolved ? '#22c55e' : 'var(--yellow)'}`,
                transition: 'all 0.2s ease'
              }}>
                {/* Query Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                      {q.id}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: `${intentColor}20`,
                      color: intentColor,
                      fontSize: 11,
                      fontWeight: 700,
                      border: `1px solid ${intentColor}40`
                    }}>
                      {q.intent ? q.intent.replace(/_/g, ' ') : 'GENERAL INQUIRY'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>• {formattedTime}</span>
                  </div>

                  {/* Evaluation Score Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      padding: '4px 10px',
                      background: 'rgba(34,197,94,0.12)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--green)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <span>🎯 Eval Score:</span>
                      <span>{q.evalScorePct}%</span>
                    </div>

                    {/* Resolution Status Pill */}
                    {q.isAutoResolved && (
                      <span style={{
                        padding: '4px 10px',
                        background: 'rgba(34,197,94,0.15)',
                        border: '1px solid rgba(34,197,94,0.4)',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#22c55e'
                      }}>
                        🤖 Auto-Resolved by AI
                      </span>
                    )}

                    {q.isResolvedByAdmin && (
                      <span style={{
                        padding: '4px 10px',
                        background: 'rgba(99,102,241,0.15)',
                        border: '1px solid rgba(99,102,241,0.4)',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--accent)'
                      }}>
                        ✅ Resolved by Admin Specialist
                      </span>
                    )}

                    {q.isPendingAdmin && (
                      <span className="status-badge" style={{
                        padding: '4px 10px',
                        background: 'rgba(245,158,11,0.15)',
                        border: '1px solid rgba(245,158,11,0.4)',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--yellow)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <span className="status-dot" style={{ background: 'var(--yellow)' }} />
                        ⏳ Sent to Admin Review Queue
                      </span>
                    )}
                  </div>
                </div>

                {/* User Message */}
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 12,
                  background: 'var(--bg-primary)',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)'
                }}>
                  "{q.message}"
                </div>

                {/* Resolution Answer Box */}
                {q.isResolvedByAdmin ? (
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: 8,
                    fontSize: 13
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        🛡️ Human Admin Resolution Fix ({q.reviewedBy || 'Apple Specialist'})
                      </span>
                      {q.reviewedAt && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Resolved at {new Date(q.reviewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {q.finalReply || q.aiProposedDraft}
                    </div>
                  </div>
                ) : q.isAutoResolved ? (
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(34,197,94,0.06)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 8,
                    fontSize: 13
                  }}>
                    <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>
                      🤖 AI Auto-Response (Instant Fix)
                    </div>
                    <div style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {q.finalReply || q.aiProposedDraft}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 8,
                    fontSize: 13
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--yellow)', marginBottom: 4 }}>
                      ⏳ Status: Escalated to Admin Review Queue
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
                      This complex query required human verification. An Apple Support Specialist is reviewing the AI-drafted fix below:
                    </div>
                    <div style={{
                      padding: '8px 12px',
                      background: 'var(--bg-primary)',
                      borderRadius: 6,
                      fontSize: 12,
                      fontStyle: 'italic',
                      color: 'var(--text-muted)'
                    }}>
                      Proposed AI Draft: "{q.aiProposedDraft}"
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
