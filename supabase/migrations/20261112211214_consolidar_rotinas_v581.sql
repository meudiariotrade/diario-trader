-- Consolidar somente políticas cuja equivalência foi comprovada no catálogo.
do $$
declare pair text[]; original record; duplicate record;
begin
 foreach pair slice 1 in array array[['fotos_select_own','fotos_ler_proprias'],['fotos_insert_own','fotos_enviar_proprias'],['fotos_update_own','fotos_trocar_proprias'],['fotos_delete_own','fotos_apagar_proprias']] loop
  select * into original from pg_policies where schemaname='storage' and tablename='objects' and policyname=pair[1];
  select * into duplicate from pg_policies where schemaname='storage' and tablename='objects' and policyname=pair[2];
  if duplicate.policyname is not null then
   if original.policyname is null or original.cmd is distinct from duplicate.cmd or original.roles is distinct from duplicate.roles or original.qual is distinct from duplicate.qual or original.with_check is distinct from duplicate.with_check then raise exception 'Políticas não equivalentes: %',pair;end if;
   execute format('drop policy %I on storage.objects',pair[2]);
  end if;
 end loop;
end $$;

-- Retirar o segredo literal dos agendamentos. O valor nunca aparece no código versionado.
do $$
declare secret_value text; item record; command_new text; headers_expression text;
begin
 if not exists(select 1 from vault.secrets where name='diario_cron_secret') then
  select ((regexp_match(command,'headers\s*:=\s*''([^'']+)'''))[1]::jsonb)->>'x-cron-secret' into secret_value from cron.job where jobname='notificar-tick';
  if secret_value is null or secret_value='__CONFIGURAR_NO_VAULT__' then raise exception 'Configure diario_cron_secret no Vault antes de aplicar as rotinas';end if;
  perform vault.create_secret(secret_value,'diario_cron_secret','Segredo interno dos jobs Diário Trader');
 end if;
 headers_expression='headers := jsonb_build_object(''Content-Type'',''application/json'',''x-cron-secret'',(select decrypted_secret from vault.decrypted_secrets where name=''diario_cron_secret''))';
 for item in select jobid,jobname,command from cron.job where jobname in ('notificar-tick','resumo-tick','radar-varrer','radar-cripto') loop
  command_new=regexp_replace(item.command,'headers\s*:=\s*''[^'']+''::jsonb',headers_expression,'i');
  if item.jobname='resumo-tick' then command_new=regexp_replace(command_new,';\s*$','')||' where exists(select 1 from public.resumos where (status in (''na_fila'',''processando'') and (trava is null or trava<=now())) or (status=''erro'' and arquivo is not null and atualizado<now()-interval ''2 days''));';end if;
  if item.jobname='notificar-tick' then command_new=regexp_replace(command_new,';\s*$','')||' where exists(select 1 from public.push_subs) or exists(select 1 from public.push_log where status in (''pendente'',''retry''));';end if;
  perform cron.alter_job(item.jobid,command:=command_new);
 end loop;
 select jobid into item from cron.job where jobname='aulas-fila';
 if item.jobid is not null then
  select command into command_new from cron.job where jobid=item.jobid;
  command_new=regexp_replace(command_new,';\s*$','')||' where exists(select 1 from public.aulas_fila where status=''pendente'' or (status=''processando'' and atualizado<now()-interval ''7 minutes''));';
  perform cron.alter_job(item.jobid,command:=command_new);
 end if;
 select jobid into item from cron.job where jobname='jornal-mesa';
 if item.jobid is not null then
  command_new='select net.http_post(url:=''https://wbpsmszecpzioaijfnsl.supabase.co/functions/v1/mesa'', '||headers_expression||', body:=''{}''::jsonb, timeout_milliseconds:=150000);';
  perform cron.alter_job(item.jobid,command:=command_new);
 end if;
end $$;
