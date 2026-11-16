-- v668: restringe a tabela de pronúncias por usuário (RLS já ativado).
-- Executada no Supabase: migration 20261116110032.
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.aulas_glossario_tts FROM authenticated;
REVOKE ALL ON TABLE public.aulas_glossario_tts FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.aulas_glossario_tts TO authenticated;
ALTER TABLE public.aulas_glossario_tts ENABLE ROW LEVEL SECURITY;
