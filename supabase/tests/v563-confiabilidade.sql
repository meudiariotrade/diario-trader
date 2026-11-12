-- Verificações transacionais: nenhum dado de teste permanece após ROLLBACK.
begin;
do $$ declare u text; begin
  select user_id::text into u from public.diario order by updated_at desc limit 1;
  if u is null then raise exception 'Conta de teste não disponível'; end if;
  perform set_config('request.jwt.claim.sub',u,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
end $$;
set local role authenticated;
do $$ declare original jsonb; version0 bigint; result jsonb; n integer; begin
  select count(*) into n from public.diario;
  if n <> 1 then raise exception 'RLS não isolou o proprietário'; end if;
  select data,revision into original,version0 from public.diario where user_id=auth.uid();
  result := public.diario_salvar_revisao(version0,original);
  if not (result->>'saved')::boolean or (result->>'revision')::bigint <> version0+1 then raise exception 'Revisão não avançou'; end if;
  result := public.diario_salvar_revisao(version0,original);
  if (result->>'saved')::boolean then raise exception 'Escrita com revisão antiga foi aceita'; end if;
  result := public.diario_salvar_cas(original,original);
  if not (result->>'saved')::boolean then raise exception 'Compatibilidade com v562 falhou'; end if;
  select revision into n from public.diario where user_id=auth.uid();
  if n <> version0+2 then raise exception 'Cliente antigo não incrementou revisão'; end if;
  if has_function_privilege('authenticated','public.push_reservar(text,text,jsonb)','EXECUTE') then raise exception 'Fila exposta ao cliente'; end if;
  if has_function_privilege('anon','public.diario_salvar_revisao(bigint,jsonb)','EXECUTE') then raise exception 'Salvamento aberto sem login'; end if;
end $$;
reset role;
do $$ declare sub text; key text := '__verificacao_v563__'||txid_current(); r jsonb; lease uuid; begin
  select id into sub from public.push_subs limit 1;
  if sub is null then raise exception 'Inscrição de teste não disponível'; end if;
  r := public.push_reservar(key,sub,'{"teste_transacional":true}'::jsonb);
  if not (r->>'reservado')::boolean then raise exception 'Reserva falhou'; end if;
  lease := (r->>'lease')::uuid;
  r := public.push_reservar(key,sub,'{}'::jsonb);
  if (r->>'reservado')::boolean then raise exception 'Reserva concorrente duplicada'; end if;
  if not public.push_concluir(key,lease,false,'503 temporário',false) then raise exception 'Falha não foi registrada'; end if;
  if (select status from public.push_log where chave=key) <> 'falhou' then raise exception 'Erro recebeu status enviado'; end if;
  update public.push_log set next_attempt_at=now()-interval '1 second' where chave=key;
  r := public.push_reservar(key,sub,'{}'::jsonb);
  if not (r->>'reservado')::boolean then raise exception 'Nova tentativa não foi reservada'; end if;
  if (r->>'lease')::uuid = lease then raise exception 'Identificador de tentativa reutilizado'; end if;
  if not public.push_concluir(key,(r->>'lease')::uuid,true,null,false) then raise exception 'Entrega não foi confirmada'; end if;
  r := public.push_reservar(key,sub,'{}'::jsonb);
  if (r->>'reservado')::boolean then raise exception 'Entrega concluída foi repetida'; end if;
end $$;
rollback;
