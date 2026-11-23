CREATE TABLE IF NOT EXISTS diario_snapshots (
 user_id TEXT PRIMARY KEY NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
 source_mt INTEGER NOT NULL DEFAULT 0 CHECK (source_mt >= 0),
 payload TEXT NOT NULL CHECK (length(payload) > 1 AND length(payload) <= 1400000),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_diario_snapshots_updated_at ON diario_snapshots(updated_at);
