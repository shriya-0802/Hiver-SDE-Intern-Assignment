#!/usr/bin/env python3
"""
01_sample_dataset.py — Sample Apple conversations from the Twitter Customer Support dataset

Usage:
  # With Kaggle dataset downloaded:
  python 01_sample_dataset.py --input twcs.csv --output ../data/apple_conversations_full.json

  # Without dataset (uses mock data already in repo):
  python 01_sample_dataset.py --mock
"""

import argparse
import json
import os
import random
from pathlib import Path

APPLE_HANDLES = {
    'AppleSupport', 'Apple', 'AppStore', 'AppleMusicHelp'
}

def sample_from_kaggle(input_csv: str, output_json: str, max_conversations: int = 2000):
    """Sample Apple conversations from the full Kaggle dataset."""
    try:
        import pandas as pd
    except ImportError:
        print("Install pandas: pip install pandas")
        return

    print(f"Loading dataset from {input_csv}...")
    df = pd.read_csv(input_csv, low_memory=False)
    
    print(f"Total rows: {len(df)}")
    
    # Filter Apple-related tweets
    apple_mask = df['author_id'].isin(APPLE_HANDLES) | df['author_id'].str.contains('Apple', na=False, case=False)
    apple_df = df[apple_mask | df['inbound'] == True]
    
    print(f"Apple-related rows: {len(apple_df)}")
    
    # Build conversation threads
    conversations = []
    response_map = {}
    
    # Build tweet lookup
    tweet_lookup = df.set_index('tweet_id').to_dict('index')
    
    for _, row in apple_df[apple_df['inbound'] == True].iterrows():
        if pd.notna(row.get('response_tweet_id')):
            response_id = str(int(row['response_tweet_id']))
            if response_id in tweet_lookup:
                response = tweet_lookup[response_id]
                if not response.get('inbound', True):
                    conversations.append({
                        "id": f"conv_{row['tweet_id']}",
                        "thread": [
                            {"author": "customer", "text": str(row['text'])},
                            {"author": "AppleSupport", "text": str(response['text'])}
                        ],
                        "intent": "UNKNOWN",  # Will be labelled
                        "escalated": False,
                        "resolution": "unknown"
                    })
    
    # Sample
    random.shuffle(conversations)
    sampled = conversations[:max_conversations]
    
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w') as f:
        json.dump(sampled, f, indent=2)
    
    print(f"Saved {len(sampled)} conversations to {output_json}")
    return sampled

def use_mock_data():
    """Use the pre-processed mock dataset already in the repo."""
    data_path = Path(__file__).parent.parent / 'data' / 'apple_conversations.json'
    if data_path.exists():
        with open(data_path) as f:
            data = json.load(f)
        print(f"Using pre-processed mock data: {len(data)} conversations")
        return data
    else:
        print("Mock data not found. Run from the data_pipeline directory.")
        return []

def main():
    parser = argparse.ArgumentParser(description='Sample Apple support conversations')
    parser.add_argument('--input', default='twcs.csv', help='Path to Kaggle CSV')
    parser.add_argument('--output', default='../data/apple_conversations.json')
    parser.add_argument('--mock', action='store_true', help='Use pre-processed mock data')
    parser.add_argument('--max', type=int, default=2000)
    args = parser.parse_args()

    if args.mock:
        data = use_mock_data()
        print(f"Intent distribution: already labelled")
    elif os.path.exists(args.input):
        data = sample_from_kaggle(args.input, args.output, args.max)
    else:
        print(f"Dataset CSV not found at {args.input}. Using mock data.")
        data = use_mock_data()
    
    if data:
        intent_counts = {}
        for conv in data:
            intent = conv.get('intent', 'UNKNOWN')
            intent_counts[intent] = intent_counts.get(intent, 0) + 1
        print("Intent distribution:", json.dumps(intent_counts, indent=2))

if __name__ == '__main__':
    main()
