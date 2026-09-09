const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

let genAI = null;
let intentModel = null;
let replyModel = null;
let judgeModel = null;

function initializeClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key_here') {
    console.warn('[LLM] No valid Gemini API key found. Running in mock mode.');
    return false;
  }
  try {
    genAI = new GoogleGenerativeAI(key);
    intentModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    replyModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    judgeModel = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    return true;
  } catch (e) {
    console.warn('[LLM] Error initializing Gemini client:', e.message);
    return false;
  }
}

const isLive = initializeClient();

// Mock responses when no API key
const MOCK_INTENTS = ['SOFTWARE_BUG', 'DEVICE_ISSUE', 'ACCOUNT_ACCESS', 'BILLING_PAYMENT', 'SERVICE_OUTAGE', 'REPAIR_WARRANTY', 'GENERAL_INQUIRY'];
const MOCK_REPLIES = {
  SOFTWARE_BUG: "We're sorry to hear about this issue! Let's troubleshoot: try restarting your device and checking for the latest software updates in Settings > General > Software Update. If the problem persists, a Reset All Settings (Settings > General > Transfer or Reset) often resolves software conflicts. DM us for personalized help! ^AS",
  DEVICE_ISSUE: "We understand how frustrating hardware issues can be. Let's start with a force restart: quickly press Volume Up, Volume Down, then hold the Side button until the Apple logo appears. If the issue continues, please visit apple.com/support/repair to schedule a Genius Bar appointment. ^AS",
  ACCOUNT_ACCESS: "Account access issues need immediate attention! Please visit iforgot.apple.com to start account recovery. If you're locked out, our Account Security team is available 24/7 at 1-800-275-2273. Keep your trusted device nearby if possible. ^AS",
  BILLING_PAYMENT: "We take billing concerns seriously. Please visit reportaproblem.apple.com to report this charge and request a refund. Our billing team reviews disputes within 48 hours. For complex cases, call 1-800-APL-CARE with your Apple ID and purchase history ready. ^AS",
  SERVICE_OUTAGE: "We're aware of service disruptions. Check apple.com/support/systemstatus for real-time status updates on all Apple services. Our engineering team is actively working to restore full service. We apologize for the inconvenience! ^AS",
  REPAIR_WARRANTY: "We want to make this right for you. Please visit apple.com/support/repair to check your warranty status and explore repair options. AppleCare+ covers accidental damage with a service fee. You can also schedule a Genius Bar appointment for in-person assessment. ^AS",
  GENERAL_INQUIRY: "Great question! For detailed information on Apple products and services, visit apple.com or the Apple Support app. You can also schedule a call with our specialists at apple.com/support. We're here to help! ^AS"
};

async function classifyIntent(message, conversationContext = '') {
  const intentLabels = ['SOFTWARE_BUG', 'DEVICE_ISSUE', 'ACCOUNT_ACCESS', 'BILLING_PAYMENT', 'SERVICE_OUTAGE', 'REPAIR_WARRANTY', 'GENERAL_INQUIRY'];
  
  if (!isLive) {
    // Mock: simple keyword matching
    const text = message.toLowerCase();
    let intent = 'GENERAL_INQUIRY';
    let confidence = 0.72;
    if (text.includes('battery') || text.includes('update') || text.includes('crash') || text.includes('bug') || text.includes('slow') || text.includes('siri') || text.includes('freeze')) { intent = 'SOFTWARE_BUG'; confidence = 0.85; }
    else if (text.includes('screen') || text.includes('button') || text.includes('airpod') || text.includes('charge') || text.includes('speaker') || text.includes('mic') || text.includes('broke')) { intent = 'DEVICE_ISSUE'; confidence = 0.82; }
    else if (text.includes('password') || text.includes('locked') || text.includes('apple id') || text.includes('2fa') || text.includes('sign in') || text.includes('login') || text.includes('account')) { intent = 'ACCOUNT_ACCESS'; confidence = 0.88; }
    else if (text.includes('charge') || text.includes('refund') || text.includes('bill') || text.includes('pay') || text.includes('subscription') || text.includes('purchase')) { intent = 'BILLING_PAYMENT'; confidence = 0.86; }
    else if (text.includes('down') || text.includes('outage') || text.includes('not loading') || text.includes('unavailable') || text.includes('icloud') && text.includes('server')) { intent = 'SERVICE_OUTAGE'; confidence = 0.79; }
    else if (text.includes('repair') || text.includes('warranty') || text.includes('genius bar') || text.includes('applecare') || text.includes('cracked') || text.includes('broken')) { intent = 'REPAIR_WARRANTY'; confidence = 0.81; }
    
    return { intent, confidence, reasoning: `Mock classification based on keyword analysis.`, allScores: intentLabels.map(l => ({ label: l, score: l === intent ? confidence : Math.random() * 0.4 })) };
  }

  const prompt = `You are an Apple customer support intent classifier.

Customer message: "${message}"
${conversationContext ? `Previous context: "${conversationContext}"` : ''}

Classify this into EXACTLY one of these intents:
- SOFTWARE_BUG: iOS/macOS crashes, app failures, update issues, software glitches
- DEVICE_ISSUE: Hardware problems (screen, battery hardware, buttons, physical damage)
- ACCOUNT_ACCESS: Apple ID, iCloud login, password reset, 2FA, locked accounts
- BILLING_PAYMENT: Charges, refunds, subscriptions, Apple Pay, billing disputes
- SERVICE_OUTAGE: iCloud down, App Store unavailable, server issues
- REPAIR_WARRANTY: AppleCare, Genius Bar, screen repair, device replacement
- GENERAL_INQUIRY: Product questions, compatibility, how-to, policies, general info

Respond in this EXACT JSON format:
{
  "intent": "INTENT_LABEL",
  "confidence": 0.95,
  "reasoning": "One sentence explanation",
  "allScores": [
    {"label": "SOFTWARE_BUG", "score": 0.05},
    {"label": "DEVICE_ISSUE", "score": 0.02},
    {"label": "ACCOUNT_ACCESS", "score": 0.01},
    {"label": "BILLING_PAYMENT", "score": 0.01},
    {"label": "SERVICE_OUTAGE", "score": 0.01},
    {"label": "REPAIR_WARRANTY", "score": 0.01},
    {"label": "GENERAL_INQUIRY", "score": 0.95}
  ]
}`;

  try {
    const result = await intentModel.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON in response');
  } catch (err) {
    console.warn('[LLM] Intent classification error (falling back to keyword engine):', err.message);
    const text = message.toLowerCase();
    let intent = 'GENERAL_INQUIRY';
    let confidence = 0.72;
    if (text.includes('battery') || text.includes('update') || text.includes('crash') || text.includes('bug') || text.includes('slow') || text.includes('siri') || text.includes('freeze')) { intent = 'SOFTWARE_BUG'; confidence = 0.85; }
    else if (text.includes('screen') || text.includes('button') || text.includes('airpod') || text.includes('charge') || text.includes('speaker') || text.includes('mic') || text.includes('broke')) { intent = 'DEVICE_ISSUE'; confidence = 0.82; }
    else if (text.includes('password') || text.includes('locked') || text.includes('apple id') || text.includes('2fa') || text.includes('sign in') || text.includes('login') || text.includes('account')) { intent = 'ACCOUNT_ACCESS'; confidence = 0.88; }
    else if (text.includes('charge') || text.includes('refund') || text.includes('bill') || text.includes('pay') || text.includes('subscription') || text.includes('purchase')) { intent = 'BILLING_PAYMENT'; confidence = 0.86; }
    else if (text.includes('down') || text.includes('outage') || text.includes('not loading') || text.includes('unavailable') || (text.includes('icloud') && text.includes('server'))) { intent = 'SERVICE_OUTAGE'; confidence = 0.79; }
    else if (text.includes('repair') || text.includes('warranty') || text.includes('genius bar') || text.includes('applecare') || text.includes('cracked') || text.includes('broken')) { intent = 'REPAIR_WARRANTY'; confidence = 0.81; }
    
    return { intent, confidence, reasoning: `Fallback classification based on keyword analysis.`, allScores: intentLabels.map(l => ({ label: l, score: l === intent ? confidence : 0.1 })) };
  }
}

async function generateReply(message, intent, similarConversations) {
  if (!isLive) {
    const reply = MOCK_REPLIES[intent] || MOCK_REPLIES.GENERAL_INQUIRY;
    return { reply, ragSimilarityScore: 0.78, groundingExamples: similarConversations.slice(0, 2).map(c => c.thread?.[0]?.text || '') };
  }

  const examplesText = similarConversations.slice(0, 3).map((conv, i) =>
    `Example ${i+1}:\nCustomer: "${conv.thread[0]?.text}"\nApple Support: "${conv.thread[1]?.text}"`
  ).join('\n\n');

  const prompt = `You are @AppleSupport on Twitter. Generate a helpful, empathetic response.

Customer message (intent: ${intent}): "${message}"

Here are real historical Apple Support responses for similar issues:
${examplesText}

Rules:
1. Match Apple's tone: professional, empathetic, action-oriented
2. Keep reply under 280 characters when possible (Twitter limit)
3. Offer specific steps, not vague advice  
4. End with a support agent code like ^AS
5. Don't hallucinate specific prices or policies
6. If you need more info, ask for it via DM

Reply:`;

  try {
    const result = await replyModel.generateContent(prompt);
    const reply = result.response.text().trim();
    return {
      reply,
      ragSimilarityScore: similarConversations.length > 0 ? 0.82 : 0.45,
      groundingExamples: similarConversations.slice(0, 2).map(c => c.thread?.[0]?.text || '')
    };
  } catch (err) {
    console.error('[LLM] Reply generation error:', err.message);
    return { reply: MOCK_REPLIES[intent] || MOCK_REPLIES.GENERAL_INQUIRY, ragSimilarityScore: 0.5, groundingExamples: [] };
  }
}

async function judgeReply(customerMessage, intent, generatedReply, similarConversations) {
  if (!isLive) {
    const scores = {
      accuracy: Math.floor(Math.random() * 2) + 3,
      empathy: Math.floor(Math.random() * 2) + 3,
      actionability: Math.floor(Math.random() * 2) + 3,
      groundedness: Math.floor(Math.random() * 2) + 3,
      tone: Math.floor(Math.random() * 2) + 3,
    };
    const overall = parseFloat((Object.values(scores).reduce((a, b) => a + b, 0) / 5).toFixed(2));
    return { scores, overall, feedback: 'Mock evaluation: response follows Apple support guidelines with actionable steps.' };
  }

  const refResponse = similarConversations[0]?.thread[1]?.text || '';

  const prompt = `You are an expert evaluator for Apple customer support responses.

Customer message: "${customerMessage}"
Intent: ${intent}
Reference good response (from Apple's actual history): "${refResponse}"
Generated response: "${generatedReply}"

Score the generated response on each dimension from 1 to 5:
- accuracy: Does it give correct Apple-specific information?
- empathy: Does it acknowledge the customer's frustration/concern?
- actionability: Does it give clear, specific next steps?
- groundedness: Is it grounded in real Apple processes (not hallucinated)?
- tone: Does it match Apple Support's professional, friendly tone?

Respond ONLY in this JSON format:
{
  "scores": {
    "accuracy": 4,
    "empathy": 5,
    "actionability": 4,
    "groundedness": 4,
    "tone": 5
  },
  "overall": 4.4,
  "feedback": "One sentence of specific feedback"
}`;

  try {
    const result = await judgeModel.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('No JSON');
  } catch (err) {
    console.error('[LLM] Judge error:', err.message);
    return { scores: { accuracy: 3, empathy: 3, actionability: 3, groundedness: 3, tone: 3 }, overall: 3.0, feedback: 'Evaluation unavailable.' };
  }
}

module.exports = { classifyIntent, generateReply, judgeReply, isLive };
