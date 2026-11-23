-- v933: preflight das rotinas, somente horário/status, sem payload e sem credenciais.
CREATE TABLE IF NOT EXISTS agenda_preflight_v933 (
 slot TEXT NOT NULL,
 component TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('running','ok','error')),
 http_status INTEGER,
 PRIMARY KEY(slot,component)
);
CREATE INDEX IF NOT EXISTS agenda_preflight_v933_state ON agenda_preflight_v933(state,slot);
