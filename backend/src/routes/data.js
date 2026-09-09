const express = require('express');
const router = express.Router();
const { getStats } = require('../services/vectorStore');

// GET /api/data/stats
router.get('/stats', (req, res) => {
  const stats = getStats();
  res.json({
    ...stats,
    brand: 'Apple',
    source: 'Customer Support on Twitter (Kaggle, thoughtvector/customer-support-on-twitter)',
    goldenSetSize: 150,
    samplingMethod: 'Stratified random sampling across all 7 intents with manual label verification',
    dataNote: 'Pre-processed subset of ~2000 Apple conversations from the 3M tweet dataset'
  });
});

module.exports = router;
