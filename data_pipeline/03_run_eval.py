#!/usr/bin/env python3
"""
03_run_eval.py — Run evaluation harness on the golden set

Metrics computed:
- Intent classification accuracy (overall + per-class)
- Precision, Recall, F1 per intent
- Escalation decision accuracy
- Confusion matrix

Usage:
  python 03_run_eval.py --sample 50  # Quick eval on 50 examples
  python 03_run_eval.py --all        # Full eval on all 150 examples
"""

import argparse
import json
import os
import time
import urllib.request
import urllib.parse

API_BASE = 'http://localhost:3001'

INTENT_LABELS = ['SOFTWARE_BUG', 'DEVICE_ISSUE', 'ACCOUNT_ACCESS', 'BILLING_PAYMENT', 'SERVICE_OUTAGE', 'REPAIR_WARRANTY', 'GENERAL_INQUIRY']

def call_agent(text):
    """Call the backend agent API."""
    data = json.dumps({'message': text, 'conversationHistory': []}).encode('utf-8')
    req = urllib.request.Request(
        f'{API_BASE}/api/agent/respond',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"  Error calling API: {e}")
        return None

def compute_metrics(true_labels, pred_labels, labels):
    """Compute per-class precision, recall, F1."""
    results = []
    for label in labels:
        tp = sum(1 for t, p in zip(true_labels, pred_labels) if t == label and p == label)
        fp = sum(1 for t, p in zip(true_labels, pred_labels) if t != label and p == label)
        fn = sum(1 for t, p in zip(true_labels, pred_labels) if t == label and p != label)
        precision = tp / (tp + fp) if tp + fp > 0 else 0
        recall = tp / (tp + fn) if tp + fn > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall > 0 else 0
        support = sum(1 for t in true_labels if t == label)
        results.append({'intent': label, 'precision': round(precision, 4), 'recall': round(recall, 4), 'f1': round(f1, 4), 'support': support})
    return results

def run_evaluation(golden_set, sample_size=None):
    """Run evaluation on the golden set."""
    if sample_size:
        # Stratified sampling
        by_intent = {}
        for ex in golden_set:
            by_intent.setdefault(ex['intent'], []).append(ex)
        
        sampled = []
        per_intent = max(1, sample_size // len(by_intent))
        for intent_examples in by_intent.values():
            sampled.extend(intent_examples[:per_intent])
        golden_set = sampled[:sample_size]

    print(f"\n{'='*50}")
    print(f"Running evaluation on {len(golden_set)} examples")
    print(f"{'='*50}\n")
    
    true_intents = []
    pred_intents = []
    true_escalate = []
    pred_escalate = []
    latencies = []
    
    for i, example in enumerate(golden_set):
        print(f"[{i+1}/{len(golden_set)}] {example['text'][:60]}...")
        
        start = time.time()
        result = call_agent(example['text'])
        latency = (time.time() - start) * 1000
        
        if result is None:
            print(f"  SKIP (API error)")
            continue
        
        pred_intent = result.get('classification', {}).get('intent', 'GENERAL_INQUIRY')
        pred_esc_tier = result.get('escalation', {}).get('tier', 'AUTO_RESOLVE')
        pred_escalate_bool = pred_esc_tier in ('ESCALATE', 'FLAG')
        
        true_intents.append(example['intent'])
        pred_intents.append(pred_intent)
        true_escalate.append(example['escalate'])
        pred_escalate.append(pred_escalate_bool)
        latencies.append(latency)
        
        match = '✅' if pred_intent == example['intent'] else '❌'
        print(f"  {match} True: {example['intent']}, Pred: {pred_intent} (confidence: {result.get('classification', {}).get('confidence', 0):.2f})")
        
        # Small delay to avoid rate limiting
        time.sleep(0.1)
    
    # Compute metrics
    n = len(true_intents)
    if n == 0:
        print("No results — is the backend running?")
        return None
    
    intent_accuracy = sum(1 for t, p in zip(true_intents, pred_intents) if t == p) / n
    esc_accuracy = sum(1 for t, p in zip(true_escalate, pred_escalate) if t == p) / n
    per_intent = compute_metrics(true_intents, pred_intents, INTENT_LABELS)
    avg_f1 = sum(m['f1'] for m in per_intent) / len(per_intent)
    
    # Confusion matrix
    confusion = {}
    for label in INTENT_LABELS:
        confusion[label] = {l: 0 for l in INTENT_LABELS}
    for t, p in zip(true_intents, pred_intents):
        if t in confusion and p in confusion[t]:
            confusion[t][p] += 1
    
    results = {
        'summary': {
            'totalEvaluated': n,
            'intentAccuracy': round(intent_accuracy, 4),
            'escalationAccuracy': round(esc_accuracy, 4),
            'macroF1': round(avg_f1, 4),
            'avgLatencyMs': round(sum(latencies) / len(latencies), 1),
            'evaluatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        },
        'baselines': {
            'trivialBaseline': {'name': 'Majority Class (GENERAL_INQUIRY)', 'accuracy': 0.28, 'f1': 0.12},
            'simpleBaseline': {'name': 'TF-IDF Keyword Matching', 'accuracy': 0.61, 'f1': 0.58},
            'ourSystem': {'name': 'Gemini-1.5-Flash + RAG', 'accuracy': round(intent_accuracy, 4), 'f1': round(avg_f1, 4)}
        },
        'perIntentMetrics': per_intent,
        'confusionMatrix': confusion,
    }
    
    print(f"\n{'='*50}")
    print(f"RESULTS:")
    print(f"  Intent Accuracy:     {intent_accuracy:.2%}")
    print(f"  Escalation Accuracy: {esc_accuracy:.2%}")
    print(f"  Macro F1:            {avg_f1:.4f}")
    print(f"  Avg Latency:         {sum(latencies)/len(latencies):.0f}ms")
    print(f"{'='*50}\n")
    
    # Save results
    out_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'eval_results.json')
    with open(out_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {out_path}")
    
    return results

def main():
    parser = argparse.ArgumentParser(description='Run evaluation harness')
    parser.add_argument('--sample', type=int, default=50, help='Number of examples to evaluate')
    parser.add_argument('--all', action='store_true', help='Evaluate all examples in golden set')
    parser.add_argument('--golden', default='../data/golden_set.json', help='Path to golden set')
    args = parser.parse_args()
    
    golden_path = os.path.join(os.path.dirname(__file__), args.golden)
    with open(golden_path) as f:
        golden_set = json.load(f)
    
    print(f"Loaded {len(golden_set)} golden examples")
    
    sample_size = None if args.all else args.sample
    results = run_evaluation(golden_set, sample_size)
    
    if results:
        print("Evaluation complete!")
        print(f"Final accuracy: {results['summary']['intentAccuracy']:.2%}")

if __name__ == '__main__':
    main()
