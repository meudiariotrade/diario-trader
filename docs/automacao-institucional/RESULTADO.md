# Automação institucional — v809 preparada para revisão

**Não publicada. Não houve merge, alteração de dados privados, consulta de Logs/Analytics ou troca de IA. O escopo completo ainda não está homologado.**

Base real: main `ef88f80c8bf822bb7f3680f80efa24f5159cd3af` (v808). Branch isolada: `prep/automacao-institucional-v809`. Nenhuma alteração na PR paralela #153.

## Entregue no código

- Calendário compartilhado B3/NYSE/Nasdaq, ações separadas de WIN/WDO/DI; horário de verão americano, Cinzas e encerramentos antecipados. Cobertura oficial auditada: **2026**. Fora dela o resultado é não verificado. ES/NQ respeitam pausa e semana de negociação; grades especiais de CME e outras commodities/câmbio não são presumidas.
- Pré/pregão/pós, feriado B3, feriado americano e fim de semana mudam contexto e prioridades da Central existente. Seletores manuais e cálculos do termômetro preservados. Um despertador de transição, cancelado ao sair/ocultar; sem polling novo no Supabase.
- Central integrada à `.v4-iacard` original, sem segundo card no Início; Meu Dia recebe instruções operacionais e os helpers de risco existentes.
- Memória IndexedDB identificada pela última sessão B3, incluindo eventos após o horário de fechamento. Notícias não reiniciam pelo dia civil. Dado sem fechamento sincronizado não gera retorno acumulado fictício.
- Cache único de GETs públicos em memória/IndexedDB, deduplicação de chamadas concorrentes, cancelamento por consumidor e marcação offline. Notícias/Carteira/Estudos reaproveitam coleta; não enviam saldos ou operações ao Worker.
- Fluxo estrangeiro reaproveita `FE`, `feHtml` e a fonte histórica B3 republicada por Dados de Mercado. Dupla consulta antiga `movimentos → macro` retirada desse recurso. Endpoint Cloudflare `/v1/fluxo`, coleta pública limitada às 11h e 17h BRT em dias úteis, amostra máxima de 65 datas. Falha preserva snapshot anterior.
- Classificação determinística do fluxo: janelas de 5/10/20 pregões contíguos, aceleração/desaceleração, equilíbrio, possível reversão e entradas sustentadas. Um dia positivo não confirma reversão. Mostra defasagem e acumulado da amostra.
- Sentimento reutiliza séries existentes, separando metodologias. Surpresa econômica integrada aos eventos da agenda existente, apenas com período e unidade comparáveis. Valores ausentes ou incompatíveis não recebem surpresa.
- Vencimentos e balanços reutilizam caches/calendários existentes; previsões não são documentos CVM confirmados.
- ADRs: classes PETR3/PBR e PETR4/PBR.A separadas. Reação exige preço e timestamp válidos posteriores ao evento, data da sessão e estado de negociação compatíveis. Sem razão oficial vigente e câmbio sincronizado não calcula paridade. Scanner sem horário real permanece referência atrasada.
- Coleta pública elimina loteria, horóscopo, colunas pessoais e publicidade identificável; retém eventos por até sete dias para atravessar fechamento/feriado/fim de semana. Endpoints públicos possuem ETag/304.
- Removidos rótulos grandes `v807` e `v808 · local`. Jornal não recebe mais o painel de notícias duplicado. Histórico fundamentalista sai do topo e integra explicação do ativo/relatório existente. Nenhuma edição em `src/journal/editorial.js`, estilos-fonte ou PDFs.
- Percentual arbitrário de confiança da v807 removido; classificação passa a ser expressamente descritiva.

## Validação executada

| Validação | Resultado |
|---|---|
| `npm run build` | aprovado; 228 arquivos estáticos |
| `npm run check` | aprovado; recursos/sintaxe e 25 funções / 43 arquivos TypeScript |
| Testes sem dependência de navegador/socket: 126 arquivos | **582 aprovados, zero falhas** |
| Casos novos de sessões/cache/fluxo/ADRs/agenda | incluídos na regressão acima |
| 20/11/2026 | B3 fechada, EUA regulares, próxima B3 23/11; âncora 19/11 às 18h BRT |
| False reversal / sentimento 13→18 / unidade econômica incompatível | aprovado com fixtures identificadas |
| Chrome disponível, modo demonstrativo | Central existente, Análises, Notícias e Jornal conferidos por DOM; captura do Jornal anexada |
| Playwright local | **bloqueado**: Chromium não iniciou (`socket() failed: Operation not permitted`) |
| Desktop 1440×900 e iPhone 390×844, CLS/mutações por 6s e capturas antes/depois | **pendente**; script `scripts/qa-sessoes-v809.cjs` preparado, sem resultados inventados |
| Safari/iPhone físico e fontes autenticadas em produção | não executado |

Uma tentativa adicional de QA em frames não produziu resultados utilizáveis: a navegação retornou ao PWA. Ela não é contada como auditoria aprovada. A captura disponível é qualitativa e não certifica viewport nem conteúdo editorial real.

O teste antigo que esperava seis chamadas `macro` passou a exigir as cinco restantes: a sexta era o fluxo que foi migrado para leitura pública. Demais requisitos de autenticação continuam testados.

## Pendências reais antes de considerar as 18 etapas concluídas

1. **Homologação visual automatizada completa**, comparação antes/depois, medição de CLS e flicker, troca de sessão com relógio controlado no app completo, navegação iPhone e regressão em Safari. A suíte completa `npm run verify` inclui navegador e não é certificada neste ambiente.
2. **Publicação autorizada do Worker** e configuração real do binding `NEWS_CACHE`: não executadas. Agendamentos de fluxo estão implementados, mas não ativados em produção por esta entrega. Depois disso validar `/v1/fluxo`, coleta e retenção real sem consultar Logs/Analytics.
3. **Fechamento histórico verificável** para todos os ativos, com fonte, razão ADR oficial vigente, câmbio e horários comparáveis. A memória de eventos funciona; comparação numérica acumulada desde o fechamento permanece bloqueada quando falta essa base. Não há baseline numérico fictício.
4. **Detecção ponta a ponta CVM/RI em tempo oportuno** do caso Vale às 18h50 e balanços, antes de certificar automação em produção. O cenário foi testado com fixture; o feed SEC genérico de 8-K existente não substitui comunicados 6-K/RI da Vale. Integrações CVM existentes foram preservadas.
5. **Cobertura completa por contrato/segmento**: feriados futuros a partir de 2027, grade especial CME, câmbio OTC, Brent/WTI/minério e opções EUA exigem calendários específicos. Não aplicar NYSE automaticamente a esses produtos.
6. **Todos os conectores públicos legados** de agenda, sentimento e balanços ainda precisam terminar sua migração para Cloudflare onde houver rotas Supabase remanescentes. A nova camada reutiliza seus caches; não é uma migração total do app.
7. Divergência estatística do fluxo com IBOV, aceleração do sentimento e interpretação automática de balanços contra estimativas exigem séries alinhadas e equivalentes. Não foram fabricadas a partir de amostras ausentes.
8. Não foi feita auditoria de eliminação de **todos** os timers legados do aplicativo. O novo código não acrescenta polling Supabase; os achados anteriores, incluindo o intervalo global de GOR, permanecem identificados no inventário.

## Atenção ao trabalho paralelo e aos arquivos gerados

A main tinha artefatos gerados desatualizados: `package.json` estava em 780 apesar de `release.config.json` estar em 808; agregados e vários bundles também divergiam das fontes já presentes na main. O build oficial regenerou esses artefatos e preparou **809**; isso explica arquivos adicionais e diffs maiores nos agregados. Não houve redesenho manual de CSS nesta branch, mas a diferença entre o publicado e as fontes da main exige a homologação visual pendente antes de merge.

Revalidar a main e reservar a versão no momento da integração, pois outra conversa pode avançar a release. **809 é uma candidata de revisão, não uma versão liberada para deploy nem uma declaração de conclusão de todo o prompt.**

Inventário: `INVENTARIO.md`. Relação integral de arquivos: `arquivos-modificados.txt`. Saídas de testes/build: `evidencias/`. Nenhuma credencial incluída.

## Estado de envio

Todos os commits permanecem locais. A revisão automática de aprovação bloqueou o `git push` da branch para o repositório público por considerar o envio uma publicação sem autorização explícita. Não houve tentativa alternativa de contornar a rejeição. Main e produção não foram alteradas.
