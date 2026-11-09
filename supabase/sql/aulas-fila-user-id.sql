-- Evita duplicar um índice equivalente já existente, mesmo que tenha outro nome.
set local lock_timeout = '2s';
do $$
begin
  if not exists (
    select 1 from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
    where i.indrelid = 'public.aulas_fila'::regclass
      and a.attname = 'user_id' and i.indisvalid and i.indpred is null
  ) then
    create index aulas_fila_user_id_idx on public.aulas_fila (user_id);
  end if;
end $$;
