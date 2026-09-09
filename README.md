<<<<<<< HEAD
# Hiver-SDE-Intern-Assignment
=======
# 🍎 Apple AI Support Agent
> **Hiver SDE Intern Take-Home Assignment**  
> *End-to-end AI Support System: Intent Classification, RAG-Grounded Replies, 4-Tier Escalation Engine & Benchmark Evaluation Dashboard.*

---

## 📌 Project Overview

This project builds and evaluates an intelligent customer support agent for **Apple** (`@AppleSupport`) trained on real-world customer support interactions from Twitter.

### Core Capabilities:
1. **7-Class Intent Classification**: Automatically categorizes customer messages into defined Apple support intents (`SOFTWARE_BUG`, `DEVICE_ISSUE`, `ACCOUNT_ACCESS`, `BILLING_PAYMENT`, `SERVICE_OUTAGE`, `REPAIR_WARRANTY`, `GENERAL_INQUIRY`).
2. **RAG-Grounded Reply Generation**: Drafts responses grounded in historical Apple support resolutions using vector similarity search over past customer-brand dialogue pairs.
3. **4-Tier Escalation Engine**: Evaluates safety risks, frustration signals, intent severity, and confidence scores to route queries (`AUTO_RESOLVE`, `SUGGEST`, `ESCALATE`, `FLAG_URGENT`).
4. **Evaluation Harness & Dashboard**: Interactive benchmarking dashboard displaying live intent accuracy, per-class F1 metrics, baseline comparisons (Trivial vs Keyword vs Our System), and 5-dimension LLM-as-Judge quality scoring.

---

## 🛠️ Architecture & System Design

```
                     ┌───────────────────────┐
                     │   Customer Message    │
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ 1. Intent Classifier  │  ──► (7-Intent Taxonomy & Confidence)
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │  2. RAG Retrieval     │  ──► (TF-IDF Vector Index / Top-5 Context)
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ 3. Reply Generator    │  ──► (Grounded Apple Resolution + Sign-off)
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ 4. Escalation Engine  │  ──► (4-Tier Rules + Frustration/Security Signals)
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ 5. LLM Quality Judge  │  ──► (5 Quality Dimensions: 1-5 scale)
                     └───────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
* Node.js (v18+)
* Python 3.10+

### Step 1: Start Backend API (Port 3001)

```bash
cd backend
npm install
npm start
```

### Step 2: Start Frontend Web App (Port 5173)

```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 📊 Evaluation & Benchmark Pipeline

You can run the evaluation benchmark suite both from the Web UI (**📊 Evaluation Dashboard**) and via terminal:

```bash
cd data_pipeline
python -m pip install -r requirements.txt
python 03_run_eval.py
```

### Key Metrics Evaluated:
* **Intent Accuracy**: Benchmark accuracy across golden-set support inquiries.
* **Escalation Accuracy**: Precision of human-escalation vs auto-resolution routing.
* **Per-Intent Precision, Recall, & F1**: Stratified performance across all 7 intent classes.
* **LLM-as-Judge Quality Scores**: Multi-dimensional scoring (Accuracy, Empathy, Actionability, Groundedness, Tone).

---

## 📂 Repository Structure

```
├── backend/                  # Node.js + Express API Server
│   ├── src/
│   │   ├── routes/           # Agent & Eval API endpoints
│   │   └── services/         # Intent classifier, RAG retrieval & escalation rules
│   ├── .env.example
│   └── package.json
├── frontend/                 # React + Vite Web Application
│   ├── src/
│   │   ├── components/       # Chat Demo, Eval Panel, Architecture Dashboard
│   │   └── App.jsx
│   └── package.json
├── data/                     # Knowledge Base & Evaluation Sets
│   ├── apple_conversations.json  # 25 Apple support interaction pairs
│   ├── golden_set.json           # 150 stratified evaluation test cases
│   └── eval_results.json         # Benchmark metrics & confusion matrix
└── data_pipeline/            # Python Data Processing & Evaluation Harness
    ├── 01_sample_dataset.py  # Twitter CS dataset processing script
    ├── 03_run_eval.py        # Automated test harness & metric calculator
    └── requirements.txt
```

---

## 📜 License
MIT License. Built for Hiver SDE Intern Take-Home Assignment.
>>>>>>> 2e88600 (Initial commit: Apple Support AI Agent full-stack application & evaluation harness)
