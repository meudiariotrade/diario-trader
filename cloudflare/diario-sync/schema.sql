CREATE TABLE IF NOT EXISTS diario_snapshots (
 user_id TEXT PRIMARY KEY NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
 source_mt INTEGER NOT NULL DEFAULT 0 CHECK (source_mt >= 0),
 payload TEXT NOT NULL CHECK (length(payload) > 1 AND length(payload) <= 1400000),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_diario_snapshots_updated_at ON diario_snapshots(updated_at);

CREATE TABLE IF NOT EXISTS private_files (owner TEXT NOT NULL,bucket TEXT NOT NULL,object_key TEXT NOT NULL,content_type TEXT,size_bytes INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'pending',source TEXT NOT NULL DEFAULT 'legacy',updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),PRIMARY KEY(owner,bucket,object_key));
CREATE INDEX IF NOT EXISTS idx_private_files_owner_status ON private_files(owner,status);
CREATE TABLE IF NOT EXISTS private_documents (owner TEXT NOT NULL,collection TEXT NOT NULL,doc_key TEXT NOT NULL,payload TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),PRIMARY KEY(owner,collection,doc_key));
CREATE INDEX IF NOT EXISTS idx_private_documents_collection ON private_documents(owner,collection);
CREATE TABLE IF NOT EXISTS private_migration_progress (owner TEXT NOT NULL,collection TEXT NOT NULL,count_rows INTEGER NOT NULL DEFAULT 0,next_offset INTEGER NOT NULL DEFAULT 0,finished INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),PRIMARY KEY(owner,collection));
