-- v600: histórico do relatório semanal (sexta 18h) para consulta rápida em Operações > Desempenho.
-- Migration aditiva, com RLS por auth.uid(). Gravado pelo app (origem 'app') e, como reserva, pela função email-semana (origem 'servidor').
create table if not exists public.weekly_reports (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  semana_ini date not null,
  semana_fim date not null,
  trades integer not null default 0,
  ganhos integer,
  perdas integer,
  acerto numeric(6,2),
  payoff numeric(10,2),
  resultado numeric(14,2),
  media_vezes_risco numeric(10,2),
  maior_queda numeric(14,2),
  perdas_alem_stop integer,
  custo_alem_stop numeric(14,2),
  sem_stop integer,
  regras_seguidas numeric(6,2),
  pregoes integer,
  checklist_pre_ok integer,
  resultado_calmo_focado numeric(14,2),
  resultado_ansioso_cansado numeric(14,2),
  faixas jsonb not null default '[]'::jsonb,
  recomendacao text,
  origem text not null default 'app' check (origem in ('app','servidor')),
  gerado_em timestamptz not null default now(),
  primary key (user_id, semana_fim)
);
comment on table public.weekly_reports is 'Resumo semanal de desempenho (trades, acerto, payoff, resultado, risco, checklist pré-09:00, estado emocional, faixas de horário e recomendação de estudo).';

alter table public.weekly_reports enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='weekly_reports' and policyname='weekly_reports_ler_proprio') then
    create policy weekly_reports_ler_proprio on public.weekly_reports for select to authenticated using (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='weekly_reports' and policyname='weekly_reports_inserir_proprio') then
    create policy weekly_reports_inserir_proprio on public.weekly_reports for insert to authenticated with check (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='weekly_reports' and policyname='weekly_reports_atualizar_proprio') then
    create policy weekly_reports_atualizar_proprio on public.weekly_reports for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  end if;
end $$;

revoke all on public.weekly_reports from anon;
grant select, insert, update on public.weekly_reports to authenticated;
grant select, insert, update on public.weekly_reports to service_role;
-- O app só lê, insere e atualiza: sem DELETE/TRUNCATE para a conta.
revoke delete, truncate, references, trigger on public.weekly_reports from authenticated;
