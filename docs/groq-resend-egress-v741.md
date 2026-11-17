# v741 — Groq, relatório semanal e redução de Egress

## Jornal
Preservar Gemini e toda a edição clássica. Após falha da pesquisa Gemini, a primeira reserva textual é Groq. O roteador recebe dados já coletados e deixa claro que o fallback NÃO teve pesquisa web; evita tentar Gemini uma segunda vez. Se a Groq estiver sem credencial, manter outras reservas existentes. OpenRouter não sofre alteração de ordem global.
Adicionada rota restrita `modo=groq_diagnostico` (cron secret v724, sem PDF/Jornal), para testar a conectividade de Groq com um texto curto, retornando apenas resultado e modelo, sem segredos. `cron_diagnostico` inclui presença de GROQ_API_KEY sem revelar valor. A chave deve ficar nos Secrets da Edge Function; NÃO colar API Key no GitHub ou no navegador.

## Relatório semanal / Resend
`email-semana` já gera `weekly_reports` no app, mesmo sem `RESEND_API_KEY`; o cron domingo 21h (Brasil) está ativo com segredo Vault. Sem uma conta Resend e `RESEND_API_KEY` válida, NÃO há envio real de e-mail; isso não pode ser resolvido inventando credenciais. Para ativar, criar chave em https://resend.com/api-keys, verificar domínio em https://resend.com/domains, e configurar `RESEND_API_KEY` + `EMAIL_DE` em Edge Functions Secrets (sem expor valores no chat). O remetente onboarding@resend.dev é só para teste com conta própria. Não enviar em lote até a configuração ser validada.

## Redução de Egress
A Mesa Macro v606, que recebia 401 sem login, deixa de chamar a Edge Function sem JWT e usa cache por 5 min / backoff de 3 min em erro. Seis consultas Macro do Terminal também deixam de ser disparadas quando não há sessão; quando autenticadas, preservam JWT e fontes anteriores.
Não modificar notícias/Push que já funcionam nem transferir operações/Profit. Redução real de Egress só pode ser confirmada no Supabase Usage; Content-Length de logs mede apenas parte da transferência e não inclui custos totais.

## Cron
Conferidos 23 jobs: 11 ativos, 12 legados desligados. Jobs atuais: calendario-push-v724, email-semana, insiders, jornal-mesa, noticias-urgentes-leve-v727, notificar-leve-v724, resumo-tick, rotina-almoco, rotina-fechamento, rotina-matinal e rotina-tarde.
Na janela auditada, os agendamentos leves de notificação e resumo tinham execuções sem falha do mecanismo. O cron jornal-mesa ainda precisa ser observado em sua primeira execução após habilitação, pois um teste manual teve falha do Gemini; a nova reserva Groq visa mitigar isso.

## Verificação
Testes completos GitHub Actions + `node --test tests/groq-egress-v741.test.cjs`, comparação de Egress 24h/72h no Usage oficial, diagnóstico autenticado Groq e conferência de cron.job_run_details/automacao_log.
