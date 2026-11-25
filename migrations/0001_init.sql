-- D1 (SQLite). Apply: npx wrangler d1 migrations apply vibpulse --remote
CREATE TABLE gaps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  gap_type TEXT NOT NULL CHECK (gap_type IN ('pricing','feature','service','quality','market','adoption')),
  market TEXT NOT NULL,
  summary TEXT NOT NULL,
  market_size REAL NOT NULL CHECK (market_size BETWEEN 0 AND 10),
  growth REAL NOT NULL CHECK (growth BETWEEN 0 AND 10),
  competition REAL NOT NULL CHECK (competition BETWEEN 0 AND 10),
  fit REAL NOT NULL CHECK (fit BETWEEN 0 AND 10),
  profit REAL NOT NULL CHECK (profit BETWEEN 0 AND 10),
  -- VibPulse formula; mirrors lib/score.ts
  score REAL GENERATED ALWAYS AS (round(market_size*0.25 + growth*0.20 + competition*0.20 + fit*0.15 + profit*0.20, 2)) STORED,
  is_sample INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX gaps_published ON gaps (status, published_at);

CREATE TABLE gap_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gap_id INTEGER NOT NULL REFERENCES gaps (id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source_name TEXT NOT NULL
);

CREATE TABLE priorities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE skill_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  taken_at TEXT NOT NULL DEFAULT (datetime('now')),
  payload TEXT NOT NULL
);
