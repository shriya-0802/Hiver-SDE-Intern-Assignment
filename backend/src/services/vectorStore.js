/**
 * In-memory Vector Store using TF-IDF cosine similarity
 * No external DB required — works out of the box
 */
const path = require('path');
const fs = require('fs');

let conversations = [];
let tfidfVectors = [];
let vocab = {};

function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function buildVocab(docs) {
  const allTokens = new Set();
  docs.forEach(doc => tokenize(doc).forEach(t => allTokens.add(t)));
  const vocabArr = Array.from(allTokens);
  vocabArr.forEach((t, i) => { vocab[t] = i; });
  return vocabArr.length;
}

function toTFIDF(text, totalDocs, docFreq) {
  const tokens = tokenize(text);
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const vec = new Array(Object.keys(vocab).length).fill(0);
  Object.entries(tf).forEach(([term, count]) => {
    if (vocab[term] !== undefined) {
      const tfidf = (count / tokens.length) * Math.log(totalDocs / (docFreq[term] || 1));
      vec[vocab[term]] = tfidf;
    }
  });
  return vec;
}

function cosineSim(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function initialize() {
  const dataPath = path.join(__dirname, '../../../data/apple_conversations.json');
  try {
    conversations = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } catch (e) {
    console.error('[VectorStore] Could not load conversations:', e.message);
    conversations = [];
    return;
  }

  const docs = conversations.map(c => c.thread[0]?.text || '');
  
  // Build document frequency
  const docFreq = {};
  docs.forEach(doc => {
    const tokens = new Set(tokenize(doc));
    tokens.forEach(t => { docFreq[t] = (docFreq[t] || 0) + 1; });
  });

  buildVocab(docs);
  tfidfVectors = docs.map(doc => toTFIDF(doc, docs.length, docFreq));
  
  console.log(`[VectorStore] Indexed ${conversations.length} Apple support conversations`);
}

function retrieve(query, intent = null, topK = 5) {
  if (conversations.length === 0) return [];
  
  // Build temporary doc freq for query
  const docFreq = {};
  conversations.forEach(c => {
    const tokens = new Set(tokenize(c.thread[0]?.text || ''));
    tokens.forEach(t => { docFreq[t] = (docFreq[t] || 0) + 1; });
  });
  
  const queryVec = toTFIDF(query, conversations.length, docFreq);
  
  let results = conversations.map((conv, i) => ({
    conv,
    similarity: cosineSim(queryVec, tfidfVectors[i])
  }));

  // Boost same-intent conversations
  if (intent) {
    results = results.map(r => ({
      ...r,
      similarity: r.conv.intent === intent ? r.similarity * 1.3 : r.similarity
    }));
  }

  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map(r => ({ ...r.conv, retrievalScore: parseFloat(r.similarity.toFixed(4)) }));
}

function getStats() {
  const intentCounts = {};
  conversations.forEach(c => {
    intentCounts[c.intent] = (intentCounts[c.intent] || 0) + 1;
  });
  return { totalConversations: conversations.length, intentDistribution: intentCounts };
}

initialize();
module.exports = { retrieve, getStats };
