# Auditoria de notificações, fontes e Egress — v728

## Correções isoladas
- Teste Push agora cria registro único em `push_log` por inscrição. A resposta do provedor não significa que o iOS exibiu o banner.
- `src/service-worker.js` salva **somente** horário e tag não sensível do último Push processado e do último toque. `Configurações → Alertas → Diagnosticar` compara esse registro IndexedDB com o último envio do servidor para o endpoint do aparelho autenticado.
- O servidor consulta somente inscrições pertencentes ao usuário autenticado; nunca expõe endpoint, assinatura, segredo VAPID nem chave de service-role.
- Feeds X: `fxtwitter.com` e `fixupx.com` (domínios alternativos do mesmo FxEmbed; **não são provedores independentes**). Tentativa estritamente sequencial. Monitor de notícias usa cooldown de 5 min após falha para impedir loops 404/429.
- Outros RSS e Finnhub continuam atendendo notícias urgentes quando um perfil do X cai. A perda de uma fonte permanece visível no diagnóstico.
- Nenhuma alteração em operações, carteira, IA, Jornal, PDFs ou agendamento pesado.

## Linha de base técnica 17/11/2026
Notebook Supabase: https://supabase.com/dashboard/project/vdzwydizostutukppcsj/explorer/notebook/5de78c2d-fd35-4b5e-bb71-095c159d36c0

No recorte de 24 horas dos logs disponíveis durante a auditoria:
- Edge Functions: 1.514 requisições, cerca de 5,884 MiB somando **Content-Length conhecido** em 1.312 respostas.
- Gateway / API: cerca de 3.160 eventos de edge, sem tamanho de resposta confiável.
- Tabelas REST mais chamadas: `analise_cache` 827, `diario` 439, `cotacoes` 334.
- Edge mais chamadas: `screener` 268, `macro` 215, `candles` 148, `terminal` 133, `mesa-macro` 131, `notificar` 118.
- Isso **não** é o Egress oficial. A fatura contabiliza PostgREST, Auth, Storage, Edge, Realtime e outros itens, mesmo sem Content-Length nos logs. Não inferir <0,5 GB/mês desses valores.

## Como medir e interpretar
1. No painel Supabase, abrir Usage → Egress, selecionar apenas o projeto `vdzwydizostutukppcsj`, anotar o gráfico diário e as modalidades.
2. Executar o notebook salvo e comparar chamadas/bytes declarados após 24 e 72h. Uma queda de requisições não equivale necessariamente a uma queda proporcional do Egress.
3. Se `analise_cache`, `diario` e `cotacoes` permanecerem com volume alto, abrir uma auditoria **isolada** desses serviços para reduzir leitura repetida, sem mudar conteúdo de carteira ou operações.
4. Não reativar os 20 crons pesados antigos. Ativos apenas `notificar-leve-v724`, `calendario-push-v724` e `noticias-urgentes-leve-v727`.
5. Para confirmar iPhone: reabrir o PWA instalado → Configurações → Alertas → Enviar teste → Diagnosticar. Registrar separadamente servidor, Service Worker e confirmação visual.

## Fontes técnicas
- Documentação de Egress: https://supabase.com/docs/guides/platform/manage-your-usage/egress
- RSS FxEmbed: https://docs.fxembed.com/guide/advanced/rss-atom-feeds/
