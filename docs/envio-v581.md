# V581 — conteúdo preparado para envio

Destino: https://github.com/meudiariotrade/diario-trader

Branch preparada: `codex/v581-analises-organizacao`. Base: v580 / `dee95aea976a42d7afa93661bd58b073583c90bc`.

## Mudanças principais

- Aba principal Análises com comandos de pesquisa fundamentalista/técnica, comparação, carteira, agenda, explicações e prova CNPI.
- Pesquisa obrigatória com fontes, documentos e datas; cálculos de YoY/QoQ/CAGR, DCF com premissas explícitas e indicadores semanal/diário/60 minutos.
- Histórico privado, etapas recuperáveis, reserva de trabalho, limite idempotente, cancelamento e correção de prova uma questão por vez.
- Consulta sem bloqueio pelo preparo, destinos de Histórico/Meu dia, contexto por conta, incidentes de rede e cobertura fiscal explícita.
- Fontes de relatórios preservadas em snapshots, extração inicial dos núcleos, publicação por manifesto e documentação dos 24 itens.

## O que está ativo e o que falta

O Supabase recebeu somente a migração aditiva de Análises e a função `pesquisa` v2. Autenticação e isolamento foram testados. As fixtures foram revertidas. A busca real está bloqueada pela cota esgotada do Gemini, incluindo a reserva de modelo.

Os arquivos desta branch ainda não foram enviados ao GitHub. A revisão automática recusou dois pushes, mesmo após conferir a identidade e as permissões do repositório. É necessária autorização explícita para enviar este conjunto de arquivos ao destino indicado.

A publicação deve passar pelo CI antes de integrar a `main`. O Chromium local está bloqueado; os testes de navegador e as capturas estão preparados para o pipeline. A consolidação de rotinas/políticas do Supabase não foi aplicada, pois a confirmação do serviço expirou. As mudanças na função antiga `analise` também permanecem somente no código.

Os 24 itens ainda não estão concluídos integralmente. O estado de cada um e os limites reais estão em `docs/validacao-v581.md`. Não há envio de ordens, mensagens, posições reais ou credenciais privadas nesse payload. Nenhuma mudança de plano foi solicitada ou executada.

## Arquivos da alteração

- `.github/workflows/deploy.yml`
- `.gitignore`
- `analises-modelo.js`
- `analises.css`
- `analises.js`
- `camadas-v560.js`
- `deploy.txt`
- `docs/arquitetura-v581.md`
- `docs/data-contracts-v581.json`
- `docs/design-references-v581.json`
- `docs/restauracao-v581.md`
- `docs/validacao-v581.md`
- `dominios.js`
- `fiscal-conferencia.js`
- `index.html`
- `manifest.webmanifest`
- `modo-simples.js`
- `navegacao-simples.js`
- `nucleo-v560.js`
- `organizacao-v573.js`
- `organizacao.js`
- `package-lock.json`
- `package.json`
- `publication.manifest.json`
- `relatorios-dados.js`
- `release.config.json`
- `runtime-dominios.js`
- `scripts/build.cjs`
- `scripts/generate-bundles.cjs`
- `src/analysis/analises-modelo.js`
- `src/analysis/analises.js`
- `src/app-core.js`
- `src/app-layers.js`
- `src/contracts/dominios.js`
- `src/contracts/relatorios-dados.js`
- `src/domains/core/01-runtime-estilos.js`
- `src/domains/core/02-estado-e-persistencia.js`
- `src/domains/core/03-render-e-operacoes.js`
- `src/domains/core/04-analises-e-estudos.js`
- `src/domains/core/05-mercado-e-noticias.js`
- `src/domains/core/06-risco-e-tecnico.js`
- `src/domains/core/07-conta-e-integracoes.js`
- `src/domains/core/08-terminal-e-sazonalidade.js`
- `src/domains/core/09-operacoes-e-estudos.js`
- `src/domains/core/10-fiscal-e-simulacoes.js`
- `src/domains/core/11-desempenho-e-carteira.js`
- `src/domains/core/12-carteira-e-inteligencia.js`
- `src/domains/core/13-diagnostico-e-relatorios.js`
- `src/domains/core/14-estudos-e-geracao.js`
- `src/domains/core/15-jornal-e-agenda.js`
- `src/domains/core/16-rotina-e-disciplina.js`
- `src/domains/core/17-fontes-e-balancos.js`
- `src/domains/core/18-carteira-e-exportacoes.js`
- `src/domains/layers/01-navegacao-e-fluxos.js`
- `src/domains/layers/02-carteira-e-terminal.js`
- `src/domains/layers/03-apresentacao.js`
- `src/domains/layers/04-design-e-navegacao.js`
- `src/index.html`
- `src/navigation/fiscal-conferencia.js`
- `src/navigation/modo-simples.js`
- `src/navigation/navegacao-simples.js`
- `src/navigation/organizacao-v573.js`
- `src/navigation/organizacao.js`
- `src/navigation/runtime-dominios.js`
- `src/navigation/terminal-fonte.js`
- `src/service-worker.js`
- `supabase/config.toml`
- `supabase/deployed-v562.json`
- `supabase/functions/analise/index.ts`
- `supabase/functions/analise/validacao.ts`
- `supabase/functions/pesquisa/atualidade.ts`
- `supabase/functions/pesquisa/contrato.ts`
- `supabase/functions/pesquisa/financeiro.ts`
- `supabase/functions/pesquisa/index.ts`
- `supabase/functions/pesquisa/motor.ts`
- `supabase/functions/pesquisa/tecnico.ts`
- `supabase/migrations/20261112193356_baseline_v580.sql`
- `supabase/migrations/20261112193404_analises_e_confiabilidade_v581.sql`
- `supabase/migrations/20261112211214_consolidar_rotinas_v581.sql`
- `supabase/tests/v581-analises-isolamento.sql`
- `sw.js`
- `terminal-fonte-v533.js`
- `tests/analises.test.cjs`
- `tests/build.test.cjs`
- `tests/organizacao-analises.test.cjs`
- `tests/organizacao-dom.test.cjs`
- `tests/pesquisa.test.cjs`
- `version.js`
