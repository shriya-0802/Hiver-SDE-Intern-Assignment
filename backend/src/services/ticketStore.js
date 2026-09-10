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
    evalScorePct: 88,
    escalationTier: 'SUGGEST',
    escalationLabel: 'Suggest (Human Review Needed)',
    escalationColor: '#eab308',
    escalationReason: 'Technical Bluetooth issue — draft prepared, recommend human review',
    aiProposedDraft: "We know how frustrating disconnecting AirPods can be! Try this: 1) Go to Settings > Bluetooth > tap 'i' > Forget This Device. 2) Put AirPods in case & hold setup button on back until light flashes amber then white. 3) Re-pair. DM us if the issue continues! ^AS",
    status: 'APPROVED',
    finalReply: "We know how frustrating disconnecting AirPods can be! Reset steps verified by Admin: 1) Go to Settings > Bluetooth > tap 'i' > Forget This Device. 2) Put AirPods in case & hold setup button on back until light flashes amber then white. 3) Re-pair.",
    reviewedBy: 'Admin (Sarah - Senior Specialist)',
    reviewedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    sentimentPulse: { scorePct: 15, level: 'CALM', emoji: '😊' }
  },
  {
    id: 'TICK-102',
    customerHandle: '@alex_apple_user',
    message: 'How do I check my iCloud storage usage on my Mac?',
    intent: 'GENERAL_INQUIRY',
    confidence: 0.96,
    evalScorePct: 96,
    escalationTier: 'AUTO_RESOLVE',
    escalationLabel: 'Auto-Resolve',
    escalationColor: '#22c55e',
    escalationReason: 'Standard informational request — high confidence',
    aiProposedDraft: "You can check your iCloud storage on Mac by opening Apple Menu > System Settings > click your Apple ID name > tap iCloud. You'll see a bar chart showing your storage usage across Photos, Backups, and Drive!",
    status: 'AUTO_RESOLVED',
    finalReply: "You can check your iCloud storage on Mac by opening Apple Menu > System Settings > click your Apple ID name > tap iCloud. You'll see a bar chart showing your storage usage across Photos, Backups, and Drive!",
    reviewedBy: '🤖 Apple AI Agent (Auto)',
    reviewedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    sentimentPulse: { scorePct: 5, level: 'CALM', emoji: '😊' }
  },
  {
    id: 'TICK-103',
    customerHandle: '@alex_apple_user',
    message: '@AppleSupport I think my Apple ID account was hacked! Someone changed my password and bought apps!',
    intent: 'ACCOUNT_ACCESS',
    confidence: 0.94,
    evalScorePct: 94,
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
  }
];

function createTicket(data) {
  const isAuto = data.escalationTier === 'AUTO_RESOLVE';
  const confidencePct = Math.round((data.confidence || 0.85) * 100);

  const newTicket = {
    id: `TICK-${Math.floor(100 + Math.random() * 900)}`,
    customerHandle: data.customerHandle || '@alex_apple_user',
    message: data.message,
    intent: data.intent || 'GENERAL_INQUIRY',
    confidence: data.confidence || 0.85,
    evalScorePct: confidencePct,
    escalationTier: data.escalationTier,
    escalationLabel: data.escalationLabel,
    escalationColor: data.escalationColor,
    escalationReason: data.escalationReason,
    aiProposedDraft: data.aiProposedDraft,
    status: isAuto ? 'AUTO_RESOLVED' : 'PENDING_REVIEW',
    finalReply: isAuto ? data.aiProposedDraft : null,
    reviewedBy: isAuto ? '🤖 Apple AI Agent (Auto)' : null,
    reviewedAt: isAuto ? new Date().toISOString() : null,
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
