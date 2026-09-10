/**
 * TicketStore — Human-in-the-Loop Admin Review Queue Store
 */
const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../../../data/tickets.json');

let tickets = [];

function clearTickets() {
  tickets = [];
  return true;
}

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
  updateTicket,
  clearTickets
};
