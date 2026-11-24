# v944 — Auditoria do Radar e redução de egress por consultas ociosas

## Quais "Radares" existem no aplicativo
1. **Radar Global (Terminal)**: painel de mercado ativo, com índice, juros, fluxos e outros dados. Preservado integralmente.
2. **Radar Proativo (botão no Terminal)**: janela `radar332` de notícias, agenda e cotações. Antes da v944, era atualizado por um `setInterval` de um minuto, consultando até três Edge Functions enquanto a barra do Terminal estivesse montada, **mesmo com a janela fechada**. O acesso por botão e as funções manuais permanecem.
3. **Radar automático de setups/sinais (`supabase/functions/radar` / Worker `diario-radar`)**: `RADAR_CUTOVER_ENABLED=0`, sem configurações ou sinais registrados no Supabase na consulta de auditoria. Não ativar nem desativar notificações em produção por suposição. Esse Worker também é o executor da agenda Cloudflare; **nunca apagá-lo** só porque o Radar automático está desligado.

## Correção v944
- Remove exclusivamente a atualização periódica automática de Radar Proativo quando a janela não está aberta.
- Preserva botão, modal, atualização imediata ao abrir, botão Atualizar e atualização por evento quando o usuário volta à janela aberta após cinco minutos.
- Não muda layout, carteira, operações, fórmulas, push, agenda Cloudflare, nem o painel Radar Global.
- Verifica comportamento por teste dedicado no GitHub Actions.
- Economia: elimina até três consultas por ciclo ocioso de Radar Proativo. **Não é medição de egress**.

## Segredos de produção — sem transferir valores por chat ou repositório
- `diario-trader` na Cloudflare: a implementação Finnhub v940 espera secret `FINNHUB_API_KEY`. Não havia binding com esse nome na auditoria.
- `FINNHUB_API_KEY` existe no Supabase Vault, mas não é transferida automaticamente; não exibir, registrar nem colocar em variáveis públicas `VITE_*`. Se quiser habilitar a fonte opcional na borda, acrescentar como **Secret** no dashboard do Worker `diario-trader`.
- `diario-radar`: `VAPID_PUBLIC`, `VAPID_PRIVATE`, `VAPID_SUBJECT` ausentes. Como o Radar automático permanece desligado, não configurá-los só para ativar recursos que não estão em uso. O serviço legado de notificações usa as chaves VAPID existentes no Supabase Vault.
- Não gerar outro par VAPID, pois isso poderia exigir que os dispositivos atuais se inscrevessem novamente.
- `AGENDA_CUTOVER_ENABLED=1` preservado; mesmo Worker Radar continua responsável por 16 agendamentos.

## Homologação
1. CI v944 passar e GitHub Pages publicar a nova versão.
2. Confirmar que abrir Radar Proativo dispara busca sob demanda e que mantê-lo fechado não consulta Terminal/Agenda/Notícias periodicamente.
3. Checar o Worker `diario-radar`: Agenda continua ativa e Radar de setups continua desligado.
4. Habilitar secret Finnhub somente por caminho seguro no dashboard e verificar binding; confirmar API como fonte de notícias antes de declarar finalizado o item de credenciais.
