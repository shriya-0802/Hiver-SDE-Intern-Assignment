import { useState, useRef, useEffect } from 'react';

const API = 'http://localhost:3001';

const INTENTS = {
  SOFTWARE_BUG: { color: '#8b5cf6', icon: '🐛' },
  DEVICE_ISSUE: { color: '#06b6d4', icon: '📱' },
  ACCOUNT_ACCESS: { color: '#f59e0b', icon: '🔐' },
  BILLING_PAYMENT: { color: '#10b981', icon: '💳' },
  SERVICE_OUTAGE: { color: '#ef4444', icon: '🔴' },
  REPAIR_WARRANTY: { color: '#f97316', icon: '🔧' },
  GENERAL_INQUIRY: { color: '#6366f1', icon: '💬' },
};

const EXAMPLES = [
  "My iPhone battery drains in 3 hours after iOS update",
  "Charged twice for Apple Music this month, this is ridiculous!",
  "Apple ID locked out, can't sign in anywhere",
  "iCloud is completely down, can't access my files",
  "MacBook screen cracked, is this under warranty?",
  "AirPods won't connect to my iPhone after re-pairing",
];

function ConfidenceBar({ value, color }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-secondary)', marginBottom:4 }}>
        <span>Confidence</span><span style={{ fontWeight:700, color }}>{pct}%</span>
      </div>
      <div className="confidence-bar-track">
        <div className="confidence-bar-fill" style={{ width:`${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function EscalationBanner({ escalation }) {
  if (!escalation) return null;
  const colors = { AUTO_RESOLVE:'var(--green)', SUGGEST:'var(--yellow)', ESCALATE:'var(--orange)', FLAG:'var(--red)' };
  const icons = { AUTO_RESOLVE:'✅', SUGGEST:'👁️', ESCALATE:'⚠️', FLAG:'🚨' };
  const color = colors[escalation.tier];
  return (
    <div className="escalation-banner" style={{ borderColor: color, background: `${color}10` }}>
      <div className="escalation-icon">{icons[escalation.tier]}</div>
      <div>
        <div className="escalation-tier" style={{ color }}>{escalation.label}</div>
        <div className="escalation-reason">{escalation.reasons?.[0]}</div>
        {escalation.signals && (
          <div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }}>
            {escalation.signals.frustrationScore > 0.3 && (
              <span className="tag" style={{ background:'rgba(239,68,68,0.1)', color:'var(--red)' }}>😤 Frustration {Math.round(escalation.signals.frustrationScore*100)}%</span>
            )}
            {escalation.signals.hasSafetyConcern && (
              <span className="tag" style={{ background:'rgba(239,68,68,0.15)', color:'var(--red)' }}>⚠️ Safety</span>
            )}
            {escalation.signals.hasRepeatAttempt && (
              <span className="tag" style={{ background:'rgba(249,115,22,0.1)', color:'var(--orange)' }}>🔄 Repeat</span>
            )}
            {escalation.signals.isLowConfidence && (
              <span className="tag" style={{ background:'rgba(234,179,8,0.1)', color:'var(--yellow)' }}>❓ Low Conf</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IntentBadge({ intent }) {
  const info = INTENTS[intent] || { color:'#6366f1', icon:'💬' };
  return (
    <span className="intent-badge" style={{ background:`${info.color}20`, color:info.color, border:`1px solid ${info.color}40` }}>
      {info.icon} {intent?.replace(/_/g,' ')}
    </span>
  );
}

function JudgeScores({ judge }) {
  if (!judge?.scores) return null;
  const scores = judge.scores;
  const keys = Object.keys(scores);
  return (
    <div>
      {keys.map(k => (
        <div key={k} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <span style={{ fontSize:11, color:'var(--text-muted)', width:90, textTransform:'capitalize' }}>{k}</span>
          <div style={{ flex:1, height:5, background:'var(--bg-primary)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(scores[k]/5)*100}%`, background:`hsl(${(scores[k]-1)*30}, 70%, 55%)`, borderRadius:3, transition:'width 0.8s ease' }} />
          </div>
          <span style={{ fontSize:12, fontWeight:700, color: scores[k] >= 4 ? 'var(--green)' : scores[k] >= 3 ? 'var(--yellow)' : 'var(--red)' }}>{scores[k]}/5</span>
        </div>
      ))}
      {judge.feedback && (
        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:8, fontStyle:'italic', padding:'8px', background:'var(--bg-primary)', borderRadius:6 }}>
          "{judge.feedback}"
        </div>
      )}
    </div>
  );
}

function RAGContext({ ragContext }) {
  if (!ragContext || !ragContext.examples?.length) return null;
  return (
    <div>
      <div className="section-title">Retrieved Context (RAG)</div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <span style={{ fontSize:11, color:'var(--text-secondary)' }}>Similarity</span>
        <div className="confidence-bar-track" style={{ flex:1 }}>
          <div className="confidence-bar-fill" style={{ width:`${(ragContext.similarityScore||0.5)*100}%`, background:'var(--accent2)' }} />
        </div>
        <span style={{ fontSize:11, color:'var(--accent2)', fontWeight:700 }}>{Math.round((ragContext.similarityScore||0.5)*100)}%</span>
      </div>
      {ragContext.examples.slice(0,2).map((ex, i) => (
        <div key={i} className="rag-example">
          <div className="rag-score">Example {i+1} · Score: {ex.score}</div>
          <div style={{ marginTop:4, lineHeight:1.5 }}>"{ex.text?.slice(0,100)}{ex.text?.length > 100 ? '…' : ''}"</div>
          {ex.resolution && <div style={{ marginTop:4, color:'var(--green)', fontSize:11 }}>→ {ex.resolution.replace(/_/g,' ')}</div>}
        </div>
      ))}
    </div>
  );
}

export default function ChatDemo() {
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'bot', text: "Hi! I'm Apple's AI support agent. I can help with device issues, account access, billing, software bugs, and more. What's going on today?", time: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [policyMode, setPolicyMode] = useState('STANDARD');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { id: Date.now(), role:'user', text: msg, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/agent/respond`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          message: msg,
          policyMode,
          conversationHistory: messages.slice(-6).map(m => ({ role:m.role, text:m.text }))
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setLastResult(data);
      if (data.metadata?.processingTimeMs && !data.classification?.confidence) setApiKeyMissing(true);

      const botMsg = {
        id: Date.now()+1,
        role:'bot',
        text: data.reply,
        intent: data.classification?.intent,
        confidence: data.classification?.confidence,
        time: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      const errMsg = { id: Date.now()+1, role:'bot', text: `⚠️ Error: ${e.message}. Make sure the backend is running on port 3001.`, time: new Date() };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ display:'flex', gap:24, flex:1, minHeight:0 }}>
      {/* Chat Column */}
      <div className="chat-panel card" style={{ flex:'1 1 480px', display:'flex', flexDirection:'column' }}>
        <div className="agent-header">
          <div className="agent-avatar">🍎</div>
          <div>
            <div className="agent-name">Apple Support AI</div>
            <div className="agent-desc">Powered by Gemini + RAG · 7 Intent Classes</div>
          </div>
          <div className="agent-live"><div className="status-dot" /> Live</div>
        </div>

        <div style={{ padding:'8px 16px', background:'rgba(255,255,255,0.03)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12 }}>
          <span style={{ color:'var(--text-muted)', fontWeight:600 }}>🎛️ Policy Simulator:</span>
          <select value={policyMode} onChange={e => setPolicyMode(e.target.value)} style={{ background:'var(--bg-card)', color:'var(--text-primary)', border:'1px solid var(--border)', borderRadius:6, padding:'3px 8px', fontSize:11, cursor:'pointer' }}>
            <option value="STANDARD">⚖️ Standard Mode</option>
            <option value="STRICT_SECURITY">🔒 Strict Security (Force Account/Payment Escalation)</option>
            <option value="HIGH_EMPATHY">💜 High Empathy (Human VIP Touch)</option>
          </select>
        </div>

        {apiKeyMissing && (
          <div style={{ padding:'10px 14px', background:'rgba(234,179,8,0.1)', border:'1px solid rgba(234,179,8,0.3)', borderRadius:'var(--radius)', marginBottom:16, fontSize:12, color:'var(--yellow)' }}>
            ⚠️ Running in mock mode. Set your Gemini API key in <code style={{ background:'rgba(0,0,0,0.3)', padding:'2px 6px', borderRadius:4 }}>backend/.env</code> for live AI responses.
          </div>
        )}

        <div className="chat-messages">
          {messages.map(m => (
            <div key={m.id} className={`message ${m.role}`}>
              <div className={`avatar ${m.role === 'user' ? 'user-avatar' : 'bot-avatar'}`}>
                {m.role === 'user' ? '👤' : '🍎'}
              </div>
              <div>
                <div className="message-bubble">{m.text}</div>
                <div className="message-meta">
                  {m.intent && <IntentBadge intent={m.intent} />}
                  {m.confidence && <span style={{ marginLeft:6 }}>{Math.round(m.confidence*100)}% confident</span>}
                  <span style={{ marginLeft: m.intent ? 8 : 0 }}>{m.time.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="message bot">
              <div className="avatar bot-avatar">🍎</div>
              <div className="message-bubble">
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                  </div>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>Analyzing…</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              placeholder="Describe your Apple support issue…"
              value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; }}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button className="send-btn" onClick={() => send()} disabled={!input.trim() || loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div className="example-queries">
            <div className="example-label">Try an example:</div>
            <div className="example-chips">
              {EXAMPLES.map((ex, i) => (
                <button key={i} className="example-chip" onClick={() => send(ex)}>{ex.slice(0, 45)}{ex.length > 45 ? '…' : ''}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Panel */}
      <div className="right-panel">
        {!lastResult ? (
          <div className="card" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
            <div className="empty-state">
              <div className="empty-icon">🧠</div>
              <div className="empty-text">Send a message to see<br/>real-time AI analysis</div>
            </div>
          </div>
        ) : (
          <>
            {/* Classification */}
            <div className="card fade-in">
              <div className="card-header">
                <div className="card-title">Intent Classification</div>
                <IntentBadge intent={lastResult.classification?.intent} />
              </div>
              <ConfidenceBar value={lastResult.classification?.confidence || 0} color={INTENTS[lastResult.classification?.intent]?.color || '#6366f1'} />
              {lastResult.classification?.reasoning && (
                <div style={{ marginTop:12, fontSize:12, color:'var(--text-secondary)', fontStyle:'italic' }}>
                  "{lastResult.classification.reasoning}"
                </div>
              )}
              {/* All scores */}
              {lastResult.classification?.allScores && (
                <div style={{ marginTop:14 }}>
                  <div className="section-title">All Intent Scores</div>
                  {lastResult.classification.allScores
                    .sort((a,b) => b.score - a.score)
                    .map(s => (
                    <div key={s.label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                      <span style={{ fontSize:10, color:'var(--text-muted)', width:100, flexShrink:0 }}>{s.label.replace(/_/g,' ')}</span>
                      <div style={{ flex:1, height:4, background:'var(--bg-primary)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${s.score*100}%`, background: INTENTS[s.label]?.color, opacity:0.7, borderRadius:2 }} />
                      </div>
                      <span style={{ fontSize:10, color:'var(--text-muted)', width:30, textAlign:'right' }}>{Math.round(s.score*100)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Escalation */}
            <div className="card fade-in">
              <div className="card-title" style={{ marginBottom:12 }}>Escalation Decision</div>
              <EscalationBanner escalation={lastResult.escalation} />
            </div>

            {/* Customer Sentiment & Frustration Gauge (Unique Feature) */}
            {lastResult.escalation?.sentimentPulse && (
              <div className="card fade-in">
                <div className="card-header" style={{ marginBottom:8 }}>
                  <div className="card-title">Customer Sentiment Pulse</div>
                  <span style={{ fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:4, background:'rgba(255,255,255,0.05)' }}>
                    {lastResult.escalation.sentimentPulse.emoji} {lastResult.escalation.sentimentPulse.level.replace(/_/g,' ')}
                  </span>
                </div>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-secondary)', marginBottom:4 }}>
                    <span>Frustration Gauge</span>
                    <span style={{ fontWeight:700, color: lastResult.escalation.sentimentPulse.scorePct >= 60 ? 'var(--red)' : lastResult.escalation.sentimentPulse.scorePct >= 30 ? 'var(--yellow)' : 'var(--green)' }}>
                      {lastResult.escalation.sentimentPulse.scorePct}%
                    </span>
                  </div>
                  <div className="confidence-bar-track">
                    <div className="confidence-bar-fill" style={{
                      width:`${lastResult.escalation.sentimentPulse.scorePct}%`,
                      background: lastResult.escalation.sentimentPulse.scorePct >= 60 ? 'var(--red)' : lastResult.escalation.sentimentPulse.scorePct >= 30 ? 'var(--yellow)' : 'var(--green)'
                    }} />
                  </div>
                </div>
              </div>
            )}

            {/* RAG */}
            <div className="card fade-in">
              <div className="card-title" style={{ marginBottom:12 }}>Grounding & Retrieval</div>
              <RAGContext ragContext={lastResult.ragContext} />
            </div>

            {/* Judge */}
            {lastResult.judgeEvaluation && (
              <div className="card fade-in">
                <div className="card-header">
                  <div className="card-title">LLM Judge Score</div>
                  <span style={{ fontSize:20, fontWeight:800, color: lastResult.judgeEvaluation.overall >= 4 ? 'var(--green)' : lastResult.judgeEvaluation.overall >= 3 ? 'var(--yellow)' : 'var(--red)' }}>
                    {lastResult.judgeEvaluation.overall?.toFixed(1)}/5
                  </span>
                </div>
                <JudgeScores judge={lastResult.judgeEvaluation} />
              </div>
            )}

            {/* Performance */}
            <div className="card fade-in">
              <div className="card-title" style={{ marginBottom:12 }}>Processing Stats</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div className="score-item">
                  <div className="score-label">Latency</div>
                  <div className="score-value" style={{ fontSize:18 }}>{lastResult.metadata?.processingTimeMs}ms</div>
                </div>
                <div className="score-item">
                  <div className="score-label">RAG Hits</div>
                  <div className="score-value" style={{ fontSize:18 }}>{lastResult.ragContext?.retrievedCount || 0}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
