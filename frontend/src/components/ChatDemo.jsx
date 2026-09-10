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
        escalation: data.escalation,
        ticket: data.ticket,
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

  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [runningDiag, setRunningDiag] = useState(false);

  const speakMessage = (msgId, text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (speakingMsgId === msgId) {
        setSpeakingMsgId(null);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);
      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Speech synthesis is not supported in your browser.');
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice Speech Recognition is not supported in this browser. Please try Google Chrome or Safari.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  const runHardwareDiagnostics = () => {
    setRunningDiag(true);
    setTimeout(() => {
      setRunningDiag(false);
      const diagReport = "📱 Apple Hardware Diagnostic Report: iPhone 15 Pro (iOS 17.5.1)\n• Battery Health: 89% (184 cycles)\n• Bluetooth Module: Pass (-42 dBm RSSI)\n• Storage: 24.5 GB Available\n• Issue Detected: Background Battery Drain on iOS Update.";
      send(diagReport);
    }, 1500);
  };

  const [showGeniusModal, setShowGeniusModal] = useState(false);
  const [showCareModal, setShowCareModal] = useState(false);
  const [geniusBooking, setGeniusBooking] = useState(null);
  const [selectedStore, setSelectedStore] = useState('Apple Store BKC (Mumbai)');
  const [selectedDate, setSelectedDate] = useState('Tomorrow at 2:30 PM');
  const [selectedCareDevice, setSelectedCareDevice] = useState('iPhone 15 Pro Max');
  const [selectedDamage, setSelectedDamage] = useState('Cracked Screen');

  const stores = [
    'Apple Store BKC (Mumbai)',
    'Apple Saket (New Delhi)',
    'Apple Fifth Avenue (New York)',
    'Apple Regent Street (London)',
    'Apple Omotesando (Tokyo)',
  ];

  const damageCosts = {
    'Cracked Screen': { care: '$29', standard: '$329' },
    'Battery Replacement': { care: '$0 (100% covered)', standard: '$99' },
    'Liquid / Water Damage': { care: '$99', standard: '$649' },
    'Rear Glass Damage': { care: '$29', standard: '$199' },
  };

  const confirmGeniusBooking = () => {
    const pass = {
      id: 'GB-' + Math.floor(100000 + Math.random() * 900000),
      store: selectedStore,
      time: selectedDate,
      device: selectedCareDevice,
      code: 'AAPL-PASS-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    };
    setGeniusBooking(pass);
    send(`📅 Booked Apple Genius Bar Appointment at ${selectedStore} for ${selectedDate} (Pass ID: ${pass.id}).`);
  };

  return (
    <div style={{ display:'flex', gap:24, flex:1, minHeight:0 }}>
      {/* Chat Column */}
      <div className="chat-panel card" style={{ flex:'1 1 480px', display:'flex', flexDirection:'column' }}>
        <div className="agent-header">
          <div className="agent-avatar">📱</div>
          <div>
            <div className="agent-name">Apple Support AI</div>
            <div className="agent-desc">Powered by Gemini + RAG · 7 Intent Classes</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowCareModal(true)}
              style={{
                padding: '4px 8px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 12,
                color: '#10b981',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}>
              🏷️ AppleCare+ Cost
            </button>
            <button
              onClick={() => setShowGeniusModal(true)}
              style={{
                padding: '4px 8px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 12,
                color: '#f59e0b',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}>
              📍 Book Genius Bar
            </button>
            <button
              onClick={runHardwareDiagnostics}
              disabled={runningDiag}
              style={{
                padding: '4px 8px',
                background: runningDiag ? 'rgba(0,113,227,0.1)' : 'rgba(0,113,227,0.12)',
                border: '1px solid rgba(0,113,227,0.3)',
                borderRadius: 12,
                color: 'var(--accent)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
              {runningDiag ? '⚙️ Scanning…' : '⚡ Run Diag'}
            </button>
            <div className="agent-live"><div className="status-dot" /> Live</div>
          </div>
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
                {m.role === 'user' ? '👤' : '📱'}
              </div>
              <div>
                <div className="message-bubble" style={{ position: 'relative' }}>
                  {m.text}
                  {m.role === 'bot' && (
                    <button
                      onClick={() => speakMessage(m.id, m.text)}
                      title="Read answer aloud with Siri Voice"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 12,
                        marginLeft: 8,
                        opacity: speakingMsgId === m.id ? 1 : 0.6
                      }}>
                      {speakingMsgId === m.id ? '🔊 Speaking…' : '🔊'}
                    </button>
                  )}
                </div>
                {m.escalation && m.escalation.tier !== 'AUTO_RESOLVE' && (
                  <div style={{ marginTop:6, padding:'6px 10px', borderRadius:6, background: `${m.escalation.color}15`, border: `1px solid ${m.escalation.color}40`, fontSize:11, color: m.escalation.color, display:'flex', alignItems:'center', gap:6 }}>
                    <span>🛡️ Human Review Queue:</span>
                    <strong>{m.escalation.label}</strong> — Sent to Admin Console for Specialist Approval {m.ticket ? `(${m.ticket.id})` : ''}
                  </div>
                )}
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
              <div className="avatar bot-avatar">📱</div>
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
              placeholder={isListening ? "🎙️ Listening to your voice..." : "Describe your Apple support issue or click 🎙️ voice input..."}
              value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; }}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              onClick={startVoiceInput}
              title="Voice Input (Speech-to-Text)"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: isListening ? 'var(--red)' : '#ffffff',
                border: '1px solid var(--border)',
                color: isListening ? 'white' : 'var(--text-primary)',
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              🎙️
            </button>
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

      {/* Apple Genius Bar Booking Modal */}
      {showGeniusModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--bg-card)', padding:24, borderRadius:16, width:440, maxWidth:'90%', border:'1px solid var(--border)', boxShadow:'0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>📍 Apple Genius Bar Reservation</h3>
              <button onClick={() => { setShowGeniusModal(false); setGeniusBooking(null); }} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text-muted)' }}>✕</button>
            </div>

            {!geniusBooking ? (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Select Apple Store Location</label>
                  <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-primary)', color:'var(--text-primary)', fontSize:13 }}>
                    {stores.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Select Time Slot</label>
                  <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-primary)', color:'var(--text-primary)', fontSize:13 }}>
                    <option value="Today at 4:30 PM">Today at 4:30 PM</option>
                    <option value="Tomorrow at 10:00 AM">Tomorrow at 10:00 AM</option>
                    <option value="Tomorrow at 2:30 PM">Tomorrow at 2:30 PM</option>
                    <option value="Saturday at 11:15 AM">Saturday at 11:15 AM</option>
                  </select>
                </div>
                <div style={{ padding:12, background:'rgba(0,113,227,0.06)', borderRadius:10, border:'1px solid rgba(0,113,227,0.2)', fontSize:12, color:'var(--accent)' }}>
                  💡 An Apple Genius specialist will examine your device and offer on-site repairs or express replacement.
                </div>
                <button onClick={confirmGeniusBooking} style={{ padding:'12px', borderRadius:10, background:'var(--accent)', color:'white', border:'none', fontWeight:700, fontSize:14, cursor:'pointer' }}>
                  Confirm & Generate Apple Pass Ticket
                </button>
              </div>
            ) : (
              <div style={{ textAlignment:'center' }}>
                <div style={{ padding:16, background:'linear-gradient(135deg, #0071e3 0%, #42a5f5 100%)', color:'white', borderRadius:14, marginBottom:16, boxShadow:'0 10px 20px rgba(0,113,227,0.25)' }}>
                  <div style={{ fontSize:12, letterSpacing:1, opacity:0.9, textTransform:'uppercase', fontWeight:700 }}> Genius Bar Pass</div>
                  <div style={{ fontSize:20, fontWeight:800, margin:'8px 0 4px 0' }}>{geniusBooking.id}</div>
                  <div style={{ fontSize:13, opacity:0.95 }}>{geniusBooking.store}</div>
                  <div style={{ fontSize:13, opacity:0.95, marginTop:4 }}>🗓️ {geniusBooking.time}</div>
                  <div style={{ marginTop:14, background:'white', padding:8, borderRadius:8, display:'inline-block' }}>
                    <span style={{ fontFamily:'monospace', fontWeight:800, color:'#0071e3', fontSize:14 }}>{geniusBooking.code}</span>
                  </div>
                </div>
                <button onClick={() => { setShowGeniusModal(false); setGeniusBooking(null); }} style={{ width:'100%', padding:'10px', borderRadius:8, background:'var(--bg-primary)', border:'1px solid var(--border)', fontWeight:600, color:'var(--text-primary)', cursor:'pointer' }}>
                  Close Pass
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AppleCare+ & Cost Estimator Modal */}
      {showCareModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--bg-card)', padding:24, borderRadius:16, width:460, maxWidth:'90%', border:'1px solid var(--border)', boxShadow:'0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>🏷️ AppleCare+ Repair Cost Estimator</h3>
              <button onClick={() => setShowCareModal(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text-muted)' }}>✕</button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Select Apple Device Model</label>
                <select value={selectedCareDevice} onChange={e => setSelectedCareDevice(e.target.value)} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-primary)', color:'var(--text-primary)', fontSize:13 }}>
                  <option value="iPhone 15 Pro Max">iPhone 15 Pro Max</option>
                  <option value="MacBook Pro 16-inch (M3 Max)">MacBook Pro 16-inch (M3 Max)</option>
                  <option value="iPad Pro 13-inch (M4)">iPad Pro 13-inch (M4)</option>
                  <option value="Apple Watch Ultra 2">Apple Watch Ultra 2</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Select Issue / Damage Type</label>
                <select value={selectedDamage} onChange={e => setSelectedDamage(e.target.value)} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-primary)', color:'var(--text-primary)', fontSize:13 }}>
                  <option value="Cracked Screen">Cracked Screen</option>
                  <option value="Battery Replacement">Battery Degradation (&lt;80% capacity)</option>
                  <option value="Liquid / Water Damage">Liquid / Accidental Water Damage</option>
                  <option value="Rear Glass Damage">Back Glass Damage</option>
                </select>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8 }}>
                <div style={{ padding:14, borderRadius:12, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.3)', textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>With AppleCare+</div>
                  <div style={{ fontSize:22, fontWeight:800, color:'#10b981', marginTop:4 }}>{damageCosts[selectedDamage]?.care}</div>
                </div>
                <div style={{ padding:14, borderRadius:12, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>Out of Warranty</div>
                  <div style={{ fontSize:22, fontWeight:800, color:'#ef4444', marginTop:4 }}>{damageCosts[selectedDamage]?.standard}</div>
                </div>
              </div>

              <button onClick={() => { send(`I'd like to check AppleCare+ coverage for my ${selectedCareDevice} with ${selectedDamage}.`); setShowCareModal(false); }} style={{ padding:'12px', borderRadius:10, background:'var(--accent)', color:'white', border:'none', fontWeight:700, fontSize:14, cursor:'pointer' }}>
                Ask AI Assistant About This Repair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

