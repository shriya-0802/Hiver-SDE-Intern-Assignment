/**
 * TicketStore — Human-in-the-Loop Admin Review Queue Store
 */
const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../../../data/tickets.json');

let tickets = [
  {
    id: 'TICK-101',
    customerHandle: '@tech_user99',
    message: '@AppleSupport my AirPods keep disconnecting from my iPhone.',
    intent: 'SOFTWARE_BUG',
    confidence: 0.88,
    escalationTier: 'SUGGEST',
    escalationLabel: 'Suggest (Human Review Needed)',
    escalationColor: '#eab308',
    escalationReason: 'Technical Bluetooth issue — draft prepared, recommend human review',
    aiProposedDraft: "We know how frustrating disconnecting AirPods can be! Try this: 1) Go to Settings > Bluetooth > tap 'i' > Forget This Device. 2) Put AirPods in case & hold setup button on back until light flashes amber then white. 3) Re-pair. DM us if the issue continues! ^AS",
    status: 'PENDING_REVIEW', // PENDING_REVIEW | APPROVED | MODIFIED | REJECTED
    finalReply: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    sentimentPulse: { scorePct: 15, level: 'CALM', emoji: '😊' }
  },
  {
    id: 'TICK-102',
    customerHandle: '@sarah_m',
    message: '@AppleSupport I think my Apple ID account was hacked! Someone changed my password and bought apps!',
    intent: 'ACCOUNT_ACCESS',
    confidence: 0.94,
    escalationTier: 'ESCALATE',
    escalationLabel: 'Escalate (Security Team)',
    escalationColor: '#f97316',
    escalationReason: 'Account security compromise requires identity verification',
    aiProposedDraft: "Account security is our top priority! Please visit iforgot.apple.com immediately to secure your account. Our Security Specialists are ready to assist. Please DM us your reference number once submitted. ^AS",
    status: 'PENDING_REVIEW',
    finalReply: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    sentimentPulse: { scorePct: 85, level: 'HIGH_FRUSTRATION', emoji: '😤' }
  },
  {
    id: 'TICK-103',
    customerHandle: '@mark_b',
    message: '@AppleSupport MY IPHONE 15 IS OVERHEATING AND BURNING MY HAND WHILE CHARGING THIS IS DANGEROUS!!',
    intent: 'DEVICE_ISSUE',
    confidence: 0.85,
    escalationTier: 'FLAG',
    escalationLabel: 'Flag Urgent (Safety Hazard)',
    escalationColor: '#ef4444',
    escalationReason: 'Safety concern detected (overheating, burn hazard)',
    aiProposedDraft: "Your safety is our absolute priority! Please immediately unplug your iPhone and stop using it. Keep it in a cool, dry area. A Senior Safety Manager will contact you via DM right now. ^AS",
    status: 'PENDING_REVIEW',
    finalReply: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    sentimentPulse: { scorePct: 100, level: 'CRITICAL_HAZARD', emoji: '🚨' }
  }
];

function createTicket(data) {
  const newTicket = {
    id: `TICK-${Math.floor(100 + Math.random() * 900)}`,
    customerHandle: data.customerHandle || '@customer',
    message: data.message,
    intent: data.intent,
    confidence: data.confidence,
    escalationTier: data.escalationTier,
    escalationLabel: data.escalationLabel,
    escalationColor: data.escalationColor,
    escalationReason: data.escalationReason,
    aiProposedDraft: data.aiProposedDraft,
    status: 'PENDING_REVIEW',
    finalReply: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date().toISOString(),
    sentimentPulse: data.sentimentPulse || { scorePct: 0, level: 'CALM', emoji: '😊' }
  };

  tickets.unshift(newTicket);
  return newTicket;
}

function getTickets() {
  return tickets;
}

function getTicketById(id) {
  return tickets.find(t => t.id === id);
}

function updateTicket(id, action, finalReply, agentName = 'Human Specialist') {
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return null;

  ticket.reviewedAt = new Date().toISOString();
  ticket.reviewedBy = agentName;

  if (action === 'APPROVE') {
    ticket.status = 'APPROVED';
    ticket.finalReply = ticket.aiProposedDraft;
  } else if (action === 'MODIFY') {
    ticket.status = 'MODIFIED';
    ticket.finalReply = finalReply;
  } else if (action === 'REJECT') {
    ticket.status = 'REJECTED';
    ticket.finalReply = finalReply || 'Issue escalated to senior Apple Support team for direct phone follow-up.';
  }

  return ticket;
}

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket
};
