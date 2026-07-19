import sqlite3
import argparse
import json
import os
import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "memory.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS memory_records (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            summary TEXT NOT NULL,
            source_layer TEXT NOT NULL,
            source_locator TEXT NOT NULL,
            source_date TEXT,
            evidence_strength TEXT NOT NULL,
            sensitivity TEXT NOT NULL,
            status TEXT NOT NULL,
            public_use_state TEXT NOT NULL,
            owner TEXT,
            last_reviewed_at TEXT,
            open_questions TEXT,
            related_ids TEXT,
            created_at TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()
    print("Memory database initialized.")

def create_record(args):
    conn = get_connection()
    c = conn.cursor()
    
    # Enforce default-to-caution rule
    status = args.status or 'draft'
    public_use = args.public_use_state or 'unknown'
    
    now = datetime.datetime.utcnow().isoformat()
    
    try:
        c.execute('''
            INSERT INTO memory_records (
                id, type, title, summary, source_layer, source_locator, source_date,
                evidence_strength, sensitivity, status, public_use_state, owner,
                last_reviewed_at, open_questions, related_ids, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            args.id, args.type, args.title, args.summary, args.source_layer, args.source_locator,
            args.source_date, args.evidence_strength, args.sensitivity, status, public_use,
            args.owner, args.last_reviewed_at, json.dumps(args.open_questions or []), json.dumps(args.related_ids or []), now
        ))
        conn.commit()
        print(f"Created memory record: {args.id}")
    except sqlite3.IntegrityError:
        print(f"Error: Record with id '{args.id}' already exists.")
    finally:
        conn.close()

def query_records(args):
    conn = get_connection()
    c = conn.cursor()
    
    query = "SELECT * FROM memory_records WHERE 1=1"
    params = []
    
    if args.id:
        query += " AND id = ?"
        params.append(args.id)
    if args.type:
        query += " AND type = ?"
        params.append(args.type)
    if args.status:
        query += " AND status = ?"
        params.append(args.status)
        
    c.execute(query, params)
    rows = c.fetchall()
    conn.close()
    
    if not rows:
        print("No records found.")
        return
        
    print(f"Found {len(rows)} records:")
    for row in rows:
        print("-" * 40)
        for key in row.keys():
            print(f"{key}: {row[key]}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Platform Memory System CLI")
    subparsers = parser.add_subparsers(dest="command")
    
    # INIT
    subparsers.add_parser("init")
    
    # CREATE
    create_p = subparsers.add_parser("create")
    create_p.add_argument("--id", required=True)
    create_p.add_argument("--type", required=True)
    create_p.add_argument("--title", required=True)
    create_p.add_argument("--summary", required=True)
    create_p.add_argument("--source_layer", required=True)
    create_p.add_argument("--source_locator", required=True)
    create_p.add_argument("--evidence_strength", required=True)
    create_p.add_argument("--sensitivity", required=True)
    create_p.add_argument("--status", default="draft")
    create_p.add_argument("--public_use_state", default="unknown")
    create_p.add_argument("--source_date")
    create_p.add_argument("--owner")
    create_p.add_argument("--last_reviewed_at")
    create_p.add_argument("--open_questions", nargs="*")
    create_p.add_argument("--related_ids", nargs="*")
    
    # QUERY
    query_p = subparsers.add_parser("query")
    query_p.add_argument("--id")
    query_p.add_argument("--type")
    query_p.add_argument("--status")
    
    args = parser.parse_args()
    
    if args.command == "init":
        init_db()
    elif args.command == "create":
        create_record(args)
    elif args.command == "query":
        query_records(args)
    else:
        parser.print_help()
