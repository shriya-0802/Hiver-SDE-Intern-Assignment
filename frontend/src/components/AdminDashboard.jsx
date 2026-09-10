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

export default function AdminDashboard({ onTicketUpdate }) {
  const [data, setData] = useState({ summary: {}, tickets: [] });
  const [loading, setLoading] = useState(true);
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [modifiedText, setModifiedText] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API}/api/admin/tickets`);
      const json = await res.json();
      setData(json);
      if (onTicketUpdate) onTicketUpdate(json.summary?.pendingCount || 0);
    } catch (e) {
      console.error('Failed to fetch admin tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (ticketId, action, customReply = null) => {
    try {
      const res = await fetch(`${API}/api/admin/tickets/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          action,
          finalReply: customReply || modifiedText,
          agentName: 'Apple Support Specialist (Human)'
        })
      });
      const result = await res.json();
      if (result.success) {
        setEditingTicketId(null);
        setModifiedText('');
        fetchTickets();
      }
    } catch (e) {
      console.error('Error submitting admin action:', e);
    }
  };

  const pendingTickets = data.tickets.filter(t => t.status === 'PENDING_REVIEW');
  const resolvedTickets = data.tickets.filter(t => t.status !== 'PENDING_REVIEW');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛡️</div>
          <div>Loading Admin Human-in-the-Loop Review Queue…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="glow-text">Human-in-the-Loop Review Queue</span>
            <span style={{ fontSize: 12, padding: '2px 10px', background: 'rgba(234,179,8,0.15)', color: 'var(--yellow)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 20 }}>
              🛡️ Admin Console
            </span>
          </h2>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Review, edit, or approve AI-generated response drafts for high-touch & sensitive Apple customer inquiries.
          </div>
        </div>
        <button onClick={fetchTickets} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12 }}>
          🔄 Refresh Queue
        </button>
      </div>

      {/* Admin Stats Bar */}
      <div className="eval-grid" style={{ marginBottom: 20 }}>
        <div className="metric-card" style={{ borderColor: 'rgba(234,179,8,0.3)' }}>
          <div className="metric-value" style={{ color: 'var(--yellow)' }}>{data.summary.pendingCount || 0}</div>
          <div className="metric-label">Pending Review</div>
          <div className="metric-sub">Requires Human Action</div>
        </div>
        <div className="metric-card" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
          <div className="metric-value" style={{ color: 'var(--green)' }}>{data.summary.approvedCount || 0}</div>
          <div className="metric-label">Approved & Sent</div>
          <div className="metric-sub">Direct AI Draft Approval</div>
        </div>
        <div className="metric-card" style={{ borderColor: 'rgba(99,102,241,0.3)' }}>
          <div className="metric-value" style={{ color: 'var(--accent)' }}>{data.summary.modifiedCount || 0}</div>
          <div className="metric-label">Modified & Sent</div>
          <div className="metric-sub">Human Edited & Enhanced</div>
        </div>
        <div className="metric-card" style={{ borderColor: 'rgba(249,115,22,0.3)' }}>
          <div className="metric-value" style={{ color: 'var(--orange)' }}>{data.summary.rejectedCount || 0}</div>
          <div className="metric-label">Human Overrides</div>
          <div className="metric-sub">Manual Specialist Takeover</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          ⏳ Pending Queue ({pendingTickets.length})
        </button>
        <button className={`tab-btn ${activeTab === 'resolved' ? 'active' : ''}`} onClick={() => setActiveTab('resolved')}>
          ✅ Resolved History ({resolvedTickets.length})
        </button>
      </div>

      {/* PENDING TICKETS QUEUE */}
      {activeTab === 'pending' && (
        <div className="fade-in">
          {pendingTickets.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Queue is Clear!</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>No customer drafts are currently waiting for human review.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pendingTickets.map(t => (
                <div key={t.id} className="card" style={{ borderLeft: `4px solid ${t.escalationColor || 'var(--yellow)'}` }}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--accent)' }}>
                        {t.id}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{t.customerHandle}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Intent Badge */}
                      <span style={{ padding: '3px 8px', borderRadius: 4, background: `${INTENT_COLORS[t.intent]}20`, color: INTENT_COLORS[t.intent], fontSize: 11, fontWeight: 600 }}>
                        {t.intent?.replace(/_/g, ' ')}
                      </span>
                      {/* Tier Badge */}
                      <span style={{ padding: '3px 8px', borderRadius: 4, background: `${t.escalationColor}20`, color: t.escalationColor, fontSize: 11, fontWeight: 700 }}>
                        {t.escalationLabel}
                      </span>
                    </div>
                  </div>

                  {/* Customer Tweet Content */}
                  <div style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 14, fontSize: 13, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>💬 Incoming Customer Tweet:</div>
                    <div style={{ fontWeight: 500, lineHeight: 1.5 }}>"{t.message}"</div>
                    {t.escalationReason && (
                      <div style={{ marginTop: 8, fontSize: 11, color: t.escalationColor, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>⚠️ Escalation Reason:</span> {t.escalationReason}
                      </div>
                    )}
                  </div>

                  {/* AI Draft Response */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                        🤖 AI Proposed Reply Draft (Gemini Grounded):
                      </span>
                      {t.sentimentPulse && (
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          Customer Sentiment: {t.sentimentPulse.emoji} {t.sentimentPulse.level?.replace(/_/g, ' ')} ({t.sentimentPulse.scorePct}%)
                        </span>
                      )}
                    </div>

                    {editingTicketId === t.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <textarea
                          rows={4}
                          value={modifiedText}
                          onChange={e => setModifiedText(e.target.value)}
                          style={{
                            width: '100%',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--accent)',
                            borderRadius: 'var(--radius-sm)',
                            padding: 12,
                            fontSize: 13,
                            fontFamily: 'Inter, sans-serif'
                          }}
                        />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => setEditingTicketId(null)} style={{ padding: '6px 12px', fontSize: 12, background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 6, cursor: 'pointer' }}>
                            Cancel
                          </button>
                          <button onClick={() => handleAction(t.id, 'MODIFY', modifiedText)} style={{ padding: '6px 14px', fontSize: 12, background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                            💾 Save & Send Modified Reply
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px dashed var(--accent)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>
                        "{t.aiProposedDraft}"
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {editingTicketId !== t.id && (
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setEditingTicketId(t.id);
                          setModifiedText(t.aiProposedDraft);
                        }}
                        style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        ✏️ Edit Draft
                      </button>

                      <button
                        onClick={() => handleAction(t.id, 'REJECT')}
                        style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        🛑 Specialist Takeover
                      </button>

                      <button
                        onClick={() => handleAction(t.id, 'APPROVE')}
                        style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}>
                        ✅ Approve & Send to Customer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RESOLVED TICKETS HISTORY */}
      {activeTab === 'resolved' && (
        <div className="card fade-in">
          <div className="card-title" style={{ marginBottom: 16 }}>Resolved Tickets Audit Log</div>
          <table className="metrics-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Customer</th>
                <th>Intent</th>
                <th>Status</th>
                <th>Action Taken</th>
                <th>Reviewed By</th>
                <th>Final Sent Reply</th>
              </tr>
            </thead>
            <tbody>
              {resolvedTickets.map(t => (
                <tr key={t.id}>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700 }}>{t.id}</td>
                  <td>{t.customerHandle}</td>
                  <td>
                    <span style={{ color: INTENT_COLORS[t.intent], fontWeight: 600 }}>{t.intent}</span>
                  </td>
                  <td>
                    <span className="tag" style={{
                      background: t.status === 'APPROVED' ? 'rgba(34,197,94,0.15)' : t.status === 'MODIFIED' ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.15)',
                      color: t.status === 'APPROVED' ? 'var(--green)' : t.status === 'MODIFIED' ? 'var(--accent)' : 'var(--red)'
                    }}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {t.status === 'APPROVED' ? 'Direct AI Draft Approved' : t.status === 'MODIFIED' ? 'Human Edited Draft' : 'Human Specialist Override'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.reviewedBy || 'Human Agent'}</td>
                  <td style={{ fontSize: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.finalReply}>
                    "{t.finalReply}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
