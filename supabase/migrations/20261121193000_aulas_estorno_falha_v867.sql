-- v867: geração de aula que falhou (IA fora do ar, JSON inválido) não consome o limite diário.
alter table app_private.aulas_consumo add column if not exists falhou boolean not null default false;

create or replace function public.aulas_estornar_uso(p_uid uuid, p_id uuid)
returns void language sql set search_path to '' as $$
 update app_private.aulas_consumo set falhou=true, concluido=coalesce(concluido,now()) where id=p_id and user_id=p_uid;
$$;
revoke all on function public.aulas_estornar_uso(uuid,uuid) from public, anon, authenticated;
grant execute on function public.aulas_estornar_uso(uuid,uuid) to service_role;

create or replace function public.aulas_reservar_uso(p_uid uuid, p_acao text, p_chave text)
returns jsonb language plpgsql set search_path to '' as $function$
declare d date := (now() at time zone 'America/Sao_Paulo')::date; n integer; lim integer; r uuid;
begin
 if p_uid is null or p_acao not in ('iniciar','parte') or length(coalesce(p_chave,'')) not between 1 and 240 then raise exception 'Reserva inválida'; end if;
 lim := case when p_acao='iniciar' then 10 else 80 end;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_uid::text || ':aulas',0));
 update app_private.aulas_consumo set concluido=now() where user_id=p_uid and concluido is null and criado<now()-interval '5 minutes';
 if exists(select 1 from app_private.aulas_consumo where user_id=p_uid and chave=p_chave and concluido is null) then
  return jsonb_build_object('permitido',false,'motivo','em_andamento');
 end if;
 select count(*) into n from app_private.aulas_consumo where user_id=p_uid and dia=d and acao=p_acao and not falhou;
 if n>=lim then return jsonb_build_object('permitido',false,'motivo','limite','limite',lim); end if;
 insert into app_private.aulas_consumo(user_id,dia,acao,chave) values(p_uid,d,p_acao,p_chave) returning id into r;
 return jsonb_build_object('permitido',true,'id',r);
end;
$function$;
