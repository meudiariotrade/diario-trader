-- v710: remover capacidades DDL/destrutivas do cliente autenticado;
-- RLS não protege TRUNCATE. Preserva SELECT/INSERT/UPDATE/DELETE já previstos.
revoke truncate, references, trigger on all tables in schema public from authenticated, anon;
