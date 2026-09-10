const express = require('express');
const router = express.Router();
const { classifyIntent } = require('../services/llmClient');
const { generateReply } = require('../services/llmClient');
const { judgeReply } = require('../services/llmClient');
const { determineEscalation } = require('../services/escalationEngine');
const { retrieve } = require('../services/vectorStore');
const { createTicket } = require('../services/ticketStore');

// POST /api/agent/respond
router.post('/respond', async (req, res) => {
  const startTime = Date.now();
  try {
    const { message, conversationHistory = [], policyMode = 'STANDARD' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const trimmedMessage = message.trim();

    // Step 1: Classify intent
    const classification = await classifyIntent(trimmedMessage, conversationHistory.slice(-3).map(m => m.text).join(' '));

    // Step 2: Retrieve similar conversations (RAG)
    const similarConvs = retrieve(trimmedMessage, classification.intent, 5);

    // Step 3: Generate reply
    const replyData = await generateReply(trimmedMessage, classification.intent, similarConvs);

    // Step 4: Determine escalation
    let escalation = determineEscalation(
      classification.intent,
      classification.confidence,
      trimmedMessage,
      conversationHistory
    );

    // Apply Policy Mode overrides (Unique Simulator Feature)
    if (policyMode === 'STRICT_SECURITY' && ['ACCOUNT_ACCESS', 'BILLING_PAYMENT'].includes(classification.intent)) {
      escalation.tier = 'ESCALATE';
      escalation.label = 'Escalate (Strict Policy)';
      escalation.reasons.unshift('🔒 Strict Security Policy Mode: Forced human routing for identity & payment protection');
    } else if (policyMode === 'HIGH_EMPATHY' && escalation.tier === 'AUTO_RESOLVE') {
      escalation.tier = 'SUGGEST';
      escalation.label = 'Suggest (High Empathy)';
      escalation.reasons.unshift('💜 High Empathy Policy Mode: Routing draft to agent for human personal touch');
    }

    // Step 5: Create Human Review Ticket for non-autoresolve queries
    let ticket = null;
    if (['SUGGEST', 'ESCALATE', 'FLAG'].includes(escalation.tier)) {
      ticket = createTicket({
        customerHandle: req.body.customerHandle || '@apple_customer',
        message: trimmedMessage,
        intent: classification.intent,
        confidence: classification.confidence,
        escalationTier: escalation.tier,
        escalationLabel: escalation.label,
        escalationColor: escalation.color,
        escalationReason: escalation.reasons?.[0] || 'Human review required',
        aiProposedDraft: replyData.reply,
        sentimentPulse: escalation.sentimentPulse
      });
    }

    // Step 6: LLM Judge
    let judgeScore = null;
    try {
      judgeScore = await judgeReply(trimmedMessage, classification.intent, replyData.reply, similarConvs);
    } catch (e) {
      judgeScore = { scores: {}, overall: null, feedback: 'Judge unavailable' };
    }

    const processingTime = Date.now() - startTime;

    res.json({
      message: trimmedMessage,
      classification: {
        intent: classification.intent,
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        allScores: classification.allScores
      },
      reply: replyData.reply,
      ragContext: {
        retrievedCount: similarConvs.length,
        similarityScore: replyData.ragSimilarityScore,
        examples: similarConvs.slice(0, 2).map(c => ({
          text: c.thread[0]?.text,
          resolution: c.resolution,
          score: c.retrievalScore
        }))
      },
      escalation,
      ticket,
      judgeEvaluation: judgeScore,
      metadata: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Agent Route] Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/agent/intents — list available intents
router.get('/intents', (req, res) => {
  res.json({
    intents: [
      { id: 'SOFTWARE_BUG', label: 'Software Bug', description: 'iOS/macOS crashes, app failures, update issues', color: '#8b5cf6' },
      { id: 'DEVICE_ISSUE', label: 'Device Issue', description: 'Hardware problems, physical damage', color: '#06b6d4' },
      { id: 'ACCOUNT_ACCESS', label: 'Account Access', description: 'Apple ID, iCloud login, password reset', color: '#f59e0b' },
      { id: 'BILLING_PAYMENT', label: 'Billing & Payment', description: 'Charges, refunds, subscriptions', color: '#10b981' },
      { id: 'SERVICE_OUTAGE', label: 'Service Outage', description: 'iCloud down, App Store issues', color: '#ef4444' },
      { id: 'REPAIR_WARRANTY', label: 'Repair & Warranty', description: 'AppleCare, Genius Bar, repairs', color: '#f97316' },
      { id: 'GENERAL_INQUIRY', label: 'General Inquiry', description: 'Product questions, how-to, policies', color: '#6366f1' }
    ]
  });
});

module.exports = router;
