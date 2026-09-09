/**
 * 4-Tier Escalation Engine
 * Tiers: AUTO_RESOLVE | SUGGEST | ESCALATE | FLAG
 */

const ESCALATION_TIERS = {
  AUTO_RESOLVE: { label: 'Auto-Resolve', color: '#22c55e', description: 'Agent can handle this automatically' },
  SUGGEST: { label: 'Suggest', color: '#eab308', description: 'Draft prepared for human review' },
  ESCALATE: { label: 'Escalate', color: '#f97316', description: 'Requires human agent intervention' },
  FLAG: { label: 'Flag Urgent', color: '#ef4444', description: 'Urgent — immediate human attention needed' }
};

// Intents that are always safe to auto-resolve
const AUTO_RESOLVE_INTENTS = new Set(['SERVICE_OUTAGE', 'GENERAL_INQUIRY']);
// Intents that should always escalate
const ALWAYS_ESCALATE_INTENTS = new Set([]);

// Urgency signals
const FRUSTRATION_PATTERNS = [
  /\b(furious|angry|outrage|horrible|terrible|disgusting|pathetic|worst|unacceptable|ridiculous)\b/i,
  /[A-Z]{4,}/,  // ALL CAPS (shouting)
  /!{2,}/,       // Multiple exclamation marks
  /\b(scam|fraud|illegal|sue|lawyer|lawsuit|refund|stolen)\b/i
];

const SAFETY_PATTERNS = [
  /\b(hot|burn|fire|smoke|explod|overheat)\b/i  // Safety hazards
];

const REPEAT_ATTEMPT_PATTERNS = [
  /\b(already|tried|again|still|keep|multiple times|several times|days)\b/i
];

function detectFrustrationScore(text) {
  let score = 0;
  FRUSTRATION_PATTERNS.forEach(pattern => { if (pattern.test(text)) score += 1; });
  return Math.min(score / FRUSTRATION_PATTERNS.length, 1.0);
}

function detectSafetyConcern(text) {
  return SAFETY_PATTERNS.some(p => p.test(text));
}

function detectRepeatAttempt(text) {
  return REPEAT_ATTEMPT_PATTERNS.some(p => p.test(text));
}

function determineEscalation(intent, confidence, message, conversationHistory = []) {
  const frustrationScore = detectFrustrationScore(message);
  const hasSafetyConcern = detectSafetyConcern(message);
  const hasRepeatAttempt = detectRepeatAttempt(message);
  const historyLength = conversationHistory.length;
  const isLowConfidence = confidence < 0.65;

  let tier = 'AUTO_RESOLVE';
  let reasons = [];

  // RULE 1: Safety concern → always FLAG
  if (hasSafetyConcern) {
    tier = 'FLAG';
    reasons.push('Safety concern detected (overheating, fire hazard)');
  }

  // RULE 2: Extreme frustration + repeat attempts → FLAG
  else if (frustrationScore > 0.6 && hasRepeatAttempt) {
    tier = 'FLAG';
    reasons.push('High frustration + repeated failed attempts detected');
  }

  // RULE 3: Fraud/account compromise + billing → ESCALATE
  else if (intent === 'BILLING_PAYMENT' && /fraud|unauthorized|scam|stolen/.test(message.toLowerCase())) {
    tier = 'ESCALATE';
    reasons.push('Fraud/unauthorized purchase allegation requires billing team review');
  }

  // RULE 4: Account security compromise → ESCALATE
  else if (intent === 'ACCOUNT_ACCESS' && /hacked|compromised|suspicious|foreign|unauthorized/.test(message.toLowerCase())) {
    tier = 'ESCALATE';
    reasons.push('Account security compromise requires identity verification');
  }

  // RULE 5: Hardware repair/warranty → ESCALATE
  else if (intent === 'REPAIR_WARRANTY') {
    tier = 'ESCALATE';
    reasons.push('Physical repair requires in-person Genius Bar assessment');
  }

  // RULE 6: Low confidence → SUGGEST
  else if (isLowConfidence) {
    tier = 'SUGGEST';
    reasons.push(`Low classification confidence (${(confidence * 100).toFixed(0)}%) — human review recommended`);
  }

  // RULE 7: High frustration (moderate) → SUGGEST
  else if (frustrationScore > 0.3) {
    tier = 'SUGGEST';
    reasons.push('Moderate customer frustration detected — review before sending');
  }

  // RULE 8: Long conversation history → SUGGEST
  else if (historyLength > 3) {
    tier = 'SUGGEST';
    reasons.push('Extended conversation — verify issue is actually resolved');
  }

  // RULE 9: Service outage or general inquiry → AUTO_RESOLVE
  else if (AUTO_RESOLVE_INTENTS.has(intent) && confidence > 0.75) {
    tier = 'AUTO_RESOLVE';
    reasons.push('Standard inquiry with high confidence — safe to auto-resolve');
  }

  // RULE 10: Default for other intents
  else if (['SOFTWARE_BUG', 'DEVICE_ISSUE'].includes(intent) && confidence > 0.75) {
    tier = 'SUGGEST';
    reasons.push('Technical issue — draft prepared, recommend human review');
  } else {
    tier = 'SUGGEST';
    reasons.push('Standard case — draft prepared for agent review');
  }

  const frustrationPct = Math.round(frustrationScore * 100);
  const sentimentLevel = hasSafetyConcern ? 'CRITICAL_HAZARD' : frustrationPct >= 60 ? 'HIGH_FRUSTRATION' : frustrationPct >= 30 ? 'MODERATE_FRUSTRATION' : 'CALM';
  const sentimentEmoji = hasSafetyConcern ? '🚨' : frustrationPct >= 60 ? '😤' : frustrationPct >= 30 ? '😐' : '😊';

  return {
    tier,
    label: ESCALATION_TIERS[tier].label,
    color: ESCALATION_TIERS[tier].color,
    description: ESCALATION_TIERS[tier].description,
    reasons,
    sentimentPulse: {
      scorePct: frustrationPct,
      level: sentimentLevel,
      emoji: sentimentEmoji,
      frustrationScore: parseFloat(frustrationScore.toFixed(2))
    },
    signals: {
      frustrationScore: parseFloat(frustrationScore.toFixed(2)),
      hasSafetyConcern,
      hasRepeatAttempt,
      isLowConfidence,
      conversationTurns: historyLength
    }
  };
}

module.exports = { determineEscalation, ESCALATION_TIERS };
