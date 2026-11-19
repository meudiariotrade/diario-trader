# v802 — Auditoria de segurança das integrações de Análises

`node scripts/analises-security-v802.cjs` executa localmente um teste estático da camada de feeds e pesquisa. Confere ausência de secrets de service-role, timers e `fetch` nos adaptadores client-side, fechamento do WebSocket Binance, arquivos no cache do PWA e ordem de inicialização dos adaptadores. Verifica com fixtures que uma regressão (timer indevido) é detectada.

Isso é um **gate de regressão de código, não pentest nem garantia de segurança integral**. Não altera CSS/UI/PDF nem consulta Logs/Analytics ou dados privados. Auditorias de autenticação, bridges Windows e permissões de produção ficam fora do alcance deste scanner.

Revisão de integração CI: etapa preparada com dependências anteriores, preservando Checklist e Operações da v789; publicação somente após teste aprovado e merge sequencial.
