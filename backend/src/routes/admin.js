const express = require('express');
const router = express.Router();
const { getTickets, updateTicket, getTicketById } = require('../services/ticketStore');

// GET /api/admin/tickets — List all tickets for human review queue
router.get('/tickets', (req, res) => {
  const allTickets = getTickets();
  const pending = allTickets.filter(t => t.status === 'PENDING_REVIEW');
  const resolved = allTickets.filter(t => t.status !== 'PENDING_REVIEW');

  res.json({
    summary: {
      total: allTickets.length,
      pendingCount: pending.length,
      resolvedCount: resolved.length,
      approvedCount: allTickets.filter(t => t.status === 'APPROVED').length,
      modifiedCount: allTickets.filter(t => t.status === 'MODIFIED').length,
      rejectedCount: allTickets.filter(t => t.status === 'REJECTED').length
    },
    tickets: allTickets
  });
});

// POST /api/admin/tickets/action — Human Admin action (Approve, Modify, Reject)
router.post('/tickets/action', (req, res) => {
  const { ticketId, action, finalReply, agentName } = req.body;

  if (!ticketId || !action) {
    return res.status(400).json({ error: 'ticketId and action are required' });
  }

  const updated = updateTicket(ticketId, action, finalReply, agentName || 'Apple Human Agent');
  if (!updated) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  res.json({
    success: true,
    message: `Ticket ${ticketId} ${action.toLowerCase()}d successfully by ${updated.reviewedBy}`,
    ticket: updated
  });
});

// GET /api/admin/tickets/:id — Poll ticket status
router.get('/tickets/:id', (req, res) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

module.exports = router;
