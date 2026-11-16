# Auditoria de Egress — Diário de Trader v706

Data: 16/11/2026. Base: `main`, regras de `CLAUDE.md`. Nenhuma alteração no banco de dados, nos dados das operações ou na ponte Profit instalada no PC.

## Fontes confirmadas no código

| Origem | Antes | Correção |
| --- | --- | --- |
| `lvPoll` — operações ao vivo | GET `cotacoes?select=*` a cada 2,5 s | Usa snapshots em memória da ponte local, Finnhub, Binance e Terminal; não consulta Supabase nesse ciclo |
| `profit-cotacoes-v552.js` | GET `cotacoes` a cada 15 s | Ponte HTTP local opcional (CORS) e snapshot Supabase no máximo a cada 15 min |
| `oaBusca` — opções | GET `cotacoes?select=*` a cada 3 s | Snapshot a cada 15 min, `select` explícito e `limit=4` |
| `nivGrava` — máximas/mínimas | `save()` a cada novo extremo, provocando upload do diário | Persistência local imediata e sincronização agrupada |
| Ranking, grade e fluxo | Releituras no Supabase a cada 1 min | Intervalo 15 min sem alterar ações manuais |
| `mercado_cache` | Releitura em consultas de conexão a cada 1 min | Cache de snapshot 15 min; Finnhub/Binance por conexões diretas já existentes |
| Prints Profit | Verificação a cada 20 s | Verificação a cada 5 min; importação manual preservada |
| Dicionário de Voz | GET remoto ao renderizar e intervalos de 60 s | Leitura de 15 min, sem intervalo, sincronização de edição com pausa em erros |
| Aulas do Mentor | `select=roteiro` a cada 60 s | Cópia por conta no IndexedDB/localStorage, 15 min e fallback offline |
| Áudio TTS / vídeo | Novo áudio por etapa / vídeo `preload=auto` com substituição do DOM | Áudio já produzido na ponte salvo no IndexedDB; vídeo `preload=none` e player preservado entre renderizações |
| Leituras de consulta via `rq` | Sem cache por usuário, respostas históricas repetidas | Cache de 15 min por usuário, até 30 chaves pequenas, limite de 4 s para GET sem timeout explícito, fallback offline para consultas não relacionadas a preços |

## Cuidados e limites

- **37 GB** é o consumo informado pelo usuário. Não corresponde a uma medição de ciclo completo após a correção.
- **Menos de 0,5 GB/mês é uma meta, não uma garantia.** Depende da quantidade de reproduções de vídeo, dos clientes conectados e de processos do PC.
- O repositório contém a ponte de **vídeo** (`bridge-video`), mas não contém, nas fontes auditadas, o publicador de cotações do Profit executado no PC. Se continuar fazendo POST no Supabase a cada segundo, esse fluxo precisa ser reconfigurado no PC; o frontend não consegue interromper um processo externo.
- Para usar cotações diretas locais, a ponte deve expor um endpoint HTTP com CORS limitado à origem do GitHub Pages e a aplicação pode usar `window.DIARIO_PONTE_LOCAL.cotacoesUrl`. Não publicar chaves `service_role` no navegador.
- Os buckets de vídeo continuam privados. O cache de vídeo do navegador depende das regras de rede do Safari; reproduções explícitas ainda geram egress.
- Nunca apagar dados locais, reconfigurar a conta, limpar a instalação PWA ou desinstalar o app enquanto houver operação pendente.
- A verificação do resultado deve usar Supabase **Usage → Egress** ao longo de um ciclo de cobrança e logs por endpoint. Redução de chamadas não é necessariamente redução proporcional de bytes.

## Validação

`npm run build`, `npm run verify` e testes de regressão `egress-v706.test.cjs` executados no GitHub Actions antes da publicação.
