-- v723: otimizações sem alterar dados existentes, ownership ou escopo de leitura.
-- Mantém a mesma regra: somente o dono vê candles do Profit.
alter policy profit_candles_dono on public.profit_candles
  using (uid = (select auth.uid()))
  with check (uid = (select auth.uid()));

-- Mantém a regra: sessões autenticadas leem candles do replay.
alter policy replay_candles_leitura_logado on public.replay_candles
  using ((select auth.uid()) is not null);

-- Índice auxiliar para procurar backups de limpeza por conta.
create index if not exists limpeza_backup_user_id_idx
  on public.limpeza_backup (user_id);
