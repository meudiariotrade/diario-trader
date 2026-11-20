# Implementação contextual Início + Meu Dia — candidata v810

## Base e proteção
- Branch: `feat/inicio-meu-dia-contextual-v810`, originada do commit `2c54a0cee096145c4de9094c6eb83db9ee3edc12` de `main` (v809).
- `CLAUDE.md` consultado integralmente. Paleta vigente: #0A0C10, #11141B, #1E232E, #D4A017.
- Alterações isoladas: não mesclar nem disparar deploy de produção antes da homologação.
- Não houve leitura de Logs / Analytics do Supabase, nem alterações nas operações, checklists originais, dados privados, PDFs, candles, segredos, Supabase ou Cloudflare.
- Preservar PRs paralelas #153 (QA) e #100.

## Alterações na candidata
- `src/domains/layers/03-apresentacao.js`: reutiliza os cards V4 de Início e Meu Dia. Adiciona ordenação de conteúdo por pré, pregão, pós; seletor contextual manual, botão Automático, expiração da escolha manual na próxima transição do calendário; usa plano, risco, regras, agenda, notícias e operações existentes. Resultado realizado e operações abertas são separados; métricas insuficientes recebem aviso sem estimativa.
- `src/app-theme.css`: identidade institucional flat, cards de alta densidade, grids `auto-fit` de largura total sem `max-width`, tipografia financeira tabular, breakpoints mobile e controle de overflow. Escopo CSS restrito a `.v810-home` e `.v810-day`.
- `src/intelligence/etapa1.js`: Central reutiliza o nó original em ambas as telas (não injeta card extra em Meu Dia); resumo primeiro, fontes/hipóteses em detalhes, sem dados não verificados apresentados como fato, marcação temporal; transição de sessão solicita atualização visual em vez de adicionar polling.
- `release.config.json`: reserva v810, base fixada no commit atual.
- `tests/inicio-meudia-contextual-v810.test.cjs`: contratos de calendário, integridade e tela única, ambiente sintético (sem dados privados).

## Arquivos anteriores reaproveitados sem modificações
- `src/shared/sessoes-mercado.js`: calendário B3/EUA por instrumento, cobertura verificada 2026.
- `src/shared/interpretacao-sessao.js`, `src/shared/cache-publico.js`: classificação/cache.
- Operações e risco existentes do core, Jornal, Análises, Agenda, Termômetro WIN/WDO e PDFs.

## Achados prévios de sobreposição / tarefas
A v809 já reaproveitava `.v4-iacard` em Início; Meu Dia ainda recebia card injetado adicional em `src/intelligence/etapa1.js` e o seletor V4 redirecionava a outra rota. Nesta candidata o componente de inteligência se ancora no próprio conteúdo de Meu Dia e o seletor opera apenas dentro da tela ativa. Timers legados e demais pendências da v809 não foram removidos globalmente: exige auditoria própria, sem apagar lógica legada por presunção.

## Evidências de validação e pendências
- Inspeção estática dos arquivos citados e verificação de sintaxe JavaScript dos dois arquivos editados: realizadas antes dos respectivos commits.
- A nova suíte Node foi **adicionada, mas ainda não executada em runner real**. Verificar workflow de pull request após criá-la.
- `npm run build`, `npm run verify`, Playwright 1440×900 e 390×844, screenshots, CLS por 6 segundos, Safari físico, dados autenticados, feriados futuros além de 2026 e regressões completas dos checklists/PDFs: **pendentes de execução/homologação**.
- Não foi possível executar o projeto localmente a partir deste ambiente porque o container não tem DNS de acesso ao GitHub; o conector GitHub é usado para trabalhar no repositório.
- Validar comparação com screenshots fornecidos pelo usuário e impacto de CSS antigo específico no runtime, além de conferir publicação **apenas depois** de aprovação e gates sem falhas críticas.
- A v809 tem pendências anteriores já documentadas em `docs/automacao-institucional/RESULTADO.md`, inclusive cache Worker e QA visual, e continuam abertas. Não declarar projeto ou release totalmente homologados.

## Estado de publicação
**Candidata em branch isolada — não publicar nem mesclar automaticamente.** O PR deve permanecer draft até que os testes reais sejam executados e as possíveis regressões críticas resolvidas.
