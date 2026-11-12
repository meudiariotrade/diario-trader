-- Fixtures sintéticas, sem login, envio ou IA. A transação inteira é revertida.
begin;
set local lock_timeout='3s';
set local statement_timeout='15s';
do $$begin
 if exists(select 1 from auth.users where id in ('58100000-0000-4000-8000-000000000001','58100000-0000-4000-8000-000000000002')) then raise exception 'IDs de teste já existem; nenhum registro será alterado';end if;
end $$;
insert into auth.users(id,aud,role) values ('58100000-0000-4000-8000-000000000001','authenticated','authenticated'),('58100000-0000-4000-8000-000000000002','authenticated','authenticated');
set local role service_role;
do $$
declare a uuid='58100000-0000-4000-8000-000000000001'; b uuid='58100000-0000-4000-8000-000000000002'; job uuid='58100000-0000-4000-8000-000000000011'; cmd jsonb='{"modo":"ANALISE","texto":"ANALISE BBAS3","tickers":["BBAS3"]}'; first jsonb; duplicate jsonb; reservation jsonb; reserved_again jsonb;
begin
 first=public.analises_criar(job,a,cmd,2,current_date);
 duplicate=public.analises_criar(job,a,cmd,2,current_date);
 if first->>'id'<>duplicate->>'id' then raise exception 'Retry duplicou o trabalho';end if;
 if (select count(*) from public.analise_uso where uid=a and dia=current_date)<>1 then raise exception 'Retry consumiu limite duas vezes';end if;
 duplicate=public.analises_criar(job,b,cmd,2,current_date);
 if duplicate->>'codigo'<>'409' then raise exception 'Outra conta recebeu o trabalho';end if;
 reservation=public.analises_reservar(job,a);
 reserved_again=public.analises_reservar(job,a);
 if reserved_again->>'ocupado'<>'true' then raise exception 'Permitiu reserva concorrente';end if;
 update public.analises_trabalhos set reserva_ate=now()-interval '1 second' where id=job;
 reserved_again=public.analises_reservar(job,a);
 if reserved_again->>'lease_id'=reservation->>'lease_id' then raise exception 'Retomada não trocou a reserva';end if;
 update public.analises_trabalhos set etapa=3,status='concluido',resultado='{"questao":{"modulo":"CT1","tema":"Risco","correta":2,"alternativas":["A","B","C","D","E"],"explicacao":"Fixture","calculo":"1+1=2"}}'::jsonb where id=job;
 first=public.analises_responder(job,a,2);
 duplicate=public.analises_responder(job,a,0);
 if first<>duplicate or first->'avaliacao'->>'acertou'<>'true' then raise exception 'Resposta já corrigida foi recontada';end if;
 insert into public.analises_trabalhos(id,user_id,comando) values ('58100000-0000-4000-8000-000000000012',b,cmd);
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','58100000-0000-4000-8000-000000000001',true);
do $$begin
 if (select count(*) from public.analises_trabalhos)<>1 then raise exception 'RLS permitiu leitura de outra conta';end if;
 begin
  update public.analises_trabalhos set status='cancelado';
  raise exception 'Cliente conseguiu escrever trabalho';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.analises_reservar('58100000-0000-4000-8000-000000000012','58100000-0000-4000-8000-000000000002');
  raise exception 'Cliente conseguiu chamar RPC privilegiada';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
rollback;
select not exists(select 1 from auth.users where id in ('58100000-0000-4000-8000-000000000001','58100000-0000-4000-8000-000000000002')) as fixtures_revertidas;
