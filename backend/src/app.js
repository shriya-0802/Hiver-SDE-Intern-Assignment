const path = require('path');
const fs = require('fs');

// Load environment variables from backend/.env or root .env
const envPath = fs.existsSync(path.resolve(__dirname, '../.env')) ? path.resolve(__dirname, '../.env') : path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath });
// Also load root .env as fallback/override if root contains key
if (fs.existsSync(path.resolve(__dirname, '../../.env'))) {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });
}

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const agentRoutes = require('./routes/agent');
const evalRoutes = require('./routes/eval');
const dataRoutes = require('./routes/data');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Serve Frontend Static Build if available
const distPath = path.resolve(__dirname, '../../frontend/dist');
const altDistPath = path.resolve(__dirname, '../frontend/dist');
const finalDistPath = fs.existsSync(distPath) ? distPath : (fs.existsSync(altDistPath) ? altDistPath : null);

if (finalDistPath) {
  console.log(`📂 Serving frontend static assets from: ${finalDistPath}`);
  app.use(express.static(finalDistPath));
}

// API Routes
app.use('/api/agent', agentRoutes);
app.use('/api/eval', evalRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// SPA fallback for frontend routing (Express 5 compatible)
if (finalDistPath) {
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && req.path !== '/health') {
      return res.sendFile(path.join(finalDistPath, 'index.html'));
    }
    next();
  });
}

// 404 handler for unmatched API routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🍎 Apple AI Support Agent Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Agent API: http://localhost:${PORT}/api/agent/respond`);
  console.log(`📈 Eval API: http://localhost:${PORT}/api/eval/results\n`);
});

module.exports = app;
