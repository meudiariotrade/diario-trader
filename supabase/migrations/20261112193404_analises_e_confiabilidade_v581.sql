-- Incremento sobre a estrutura v580. Não altera diário, posições ou relatórios existentes.
create table if not exists public.analises_trabalhos (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 comando jsonb not null,
 status text not null default 'aguardando' check (status in ('aguardando','processando','concluido','falhou','cancelado')),
 etapa integer not null default 0 check (etapa between 0 and 3),
 tentativas integer not null default 0,
 tentativas_etapa integer not null default 0,
 checkpoint jsonb not null default '{}'::jsonb,
 resultado jsonb,
 erro text,
 lease_id uuid,
 reserva_ate timestamptz,
 criado timestamptz not null default now(),
 atualizado timestamptz not null default now()
);
create index if not exists analises_trabalhos_owner_updated on public.analises_trabalhos(user_id,atualizado desc);
alter table public.analises_trabalhos enable row level security;
revoke all on public.analises_trabalhos from anon,authenticated;
grant select on public.analises_trabalhos to authenticated;
grant all on public.analises_trabalhos to service_role;
create policy analises_leitura_propria on public.analises_trabalhos for select to authenticated using ((select auth.uid())=user_id);
comment on table public.analises_trabalhos is 'Trabalhos de pesquisa por conta, com checkpoints. Escrita exclusiva do servidor autenticado; nunca uma ordem de negociação.';

create or replace function public.analises_criar(p_id uuid,p_uid uuid,p_comando jsonb,p_limite integer,p_dia date)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare item public.analises_trabalhos;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_uid::text,581));
 select * into item from public.analises_trabalhos where id=p_id;
 if found then
  if item.user_id<>p_uid then return jsonb_build_object('erro','Identificador já utilizado.','codigo',409);end if;
  if item.comando<>p_comando then return jsonb_build_object('erro','O identificador pertence a outro comando.','codigo',409);end if;
  return to_jsonb(item);
 end if;
 if (select count(*) from public.analises_trabalhos where user_id=p_uid and status in ('aguardando','processando') and atualizado>now()-interval '1 day')>=3 then
  return jsonb_build_object('erro','Há três pesquisas pendentes. Retome ou cancele uma antes de criar outra.','codigo',429);
 end if;
 if not public.analise_reservar_uso(p_uid,p_dia,'pesquisa',greatest(0,least(p_limite,100000))) then
  return jsonb_build_object('erro','Limite diário de pesquisa atingido. O histórico continua disponível.','codigo',429);
 end if;
 insert into public.analises_trabalhos(id,user_id,comando) values(p_id,p_uid,p_comando) returning * into item;
 return to_jsonb(item);
end $$;

create or replace function public.analises_reservar(p_id uuid,p_uid uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare item public.analises_trabalhos;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_uid::text,581));
 select * into item from public.analises_trabalhos where id=p_id and user_id=p_uid for update;
 if not found then return jsonb_build_object('erro','Trabalho não encontrado.');end if;
 if item.status in ('concluido','cancelado') then return to_jsonb(item);end if;
 if item.reserva_ate>now() then return jsonb_build_object('ocupado',true);end if;
 if item.tentativas_etapa>=5 then return jsonb_build_object('erro','Esta etapa falhou cinco vezes. Confira a fonte e inicie uma nova pesquisa.');end if;
 if (select count(*) from public.analises_trabalhos where user_id=p_uid and id<>p_id and reserva_ate>now())>=1 then return jsonb_build_object('ocupado',true);end if;
 update public.analises_trabalhos set status='processando',tentativas=tentativas+1,tentativas_etapa=tentativas_etapa+1,lease_id=gen_random_uuid(),reserva_ate=now()+interval '65 seconds',atualizado=now(),erro=null where id=p_id returning * into item;
 return to_jsonb(item);
end $$;

create or replace function public.analises_responder(p_id uuid,p_uid uuid,p_resposta integer)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare item public.analises_trabalhos; q jsonb; avaliacao jsonb;
begin
 select * into item from public.analises_trabalhos where id=p_id and user_id=p_uid for update;
 if not found or item.status<>'concluido' or item.resultado->'questao' is null then raise exception 'Questão não encontrada';end if;
 if p_resposta<0 or p_resposta>4 then raise exception 'Alternativa inválida';end if;
 if item.resultado->'avaliacao' is not null then return jsonb_build_object('avaliacao',item.resultado->'avaliacao');end if;
 q=item.resultado->'questao';
 avaliacao=jsonb_build_object('resposta',p_resposta,'correta',(q->>'correta')::integer,'acertou',p_resposta=(q->>'correta')::integer,'explicacao',q->>'explicacao','calculo',q->>'calculo','respondido_em',now());
 update public.analises_trabalhos set resultado=jsonb_set(resultado,'{avaliacao}',avaliacao),atualizado=now() where id=p_id;
 return jsonb_build_object('avaliacao',avaliacao);
end $$;
revoke all on function public.analises_criar(uuid,uuid,jsonb,integer,date) from public,anon,authenticated;
revoke all on function public.analises_reservar(uuid,uuid) from public,anon,authenticated;
revoke all on function public.analises_responder(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.analises_criar(uuid,uuid,jsonb,integer,date) to service_role;
grant execute on function public.analises_reservar(uuid,uuid) to service_role;
grant execute on function public.analises_responder(uuid,uuid,integer) to service_role;
