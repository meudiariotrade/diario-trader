-- v932. Dados exclusivamente técnicos; nunca gravar tokens, corpo de respostas ou dados privados.
CREATE TABLE IF NOT EXISTS agenda_runs_v932 (
  job TEXT NOT NULL,
  slot TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'running' CHECK(state IN ('running','ok','error')),
  http_status INTEGER,
  duration_ms INTEGER,
  finished_at TEXT,
  PRIMARY KEY(job,slot)
);
CREATE INDEX IF NOT EXISTS agenda_runs_v932_slot_idx ON agenda_runs_v932(slot);
