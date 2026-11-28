# Saída do Supabase — v1054 (Etapa 2)

Objetivo: o Supabase fica **só com Auth (login) e tabelas**. Toda computação
(Edge Functions) passa para os Workers da Cloudflare.

## Como funciona a troca (sem risco de quebrar)

1. O app chama `…supabase.co/functions/v1/<nome>` como sempre.
2. `src/shared/funcoes-cloudflare-v1042.js` desvia a chamada para
   `diario-trader…workers.dev/v1/fn/<nome>`.
3. O Worker (`cloudflare/diario-noticias/funcoes-v1042.mjs`) roda **o mesmo
   código** de `supabase/functions/<nome>/index.ts`.
4. Se o Worker falhar (rede, 404 ou 5xx) **ou ainda não tiver as chaves**
   (responde 503), o app volta sozinho para a função antiga do Supabase.

Ou seja: cada função passa a rodar na Cloudflare assim que as chaves dela
estiverem cadastradas no Worker `diario-trader`.

## Fase A (v1042) — já no Worker
`terminal`, `mesa-macro`, `sazonal-extras`, `finnhub-token`.
Cotações, notícias, ADRs, juros, candles, EWZ, macro e sentimento já tinham
implementação própria na Cloudflare.

## Fase B (v1054) — aproveita as chaves que já existem

Nada precisa ser cadastrado de novo. O Worker `diario-trader` resolve as chaves assim:

1. **Variáveis do próprio Worker** (as que já estão no painel da Cloudflare);
2. **URL e chave pública do Supabase**: se faltarem no Worker, usa os valores públicos que o app
   já publica em `config.js` (não são segredos);
3. **Chaves de IA** (`GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`…): se faltarem no Worker,
   busca no **Vault do Supabase** (`rpc ia_chaves`) com a `SUPABASE_SERVICE_ROLE_KEY` que o Worker já
   tem — o mesmo caminho que a Pesquisa usa em produção. As chaves nunca saem do servidor.

| Função | Precisa |
|---|---|
| `analise`, `resumo`, `mesa` | `SUPABASE_SERVICE_ROLE_KEY` no Worker + chave Gemini no Worker **ou** no Vault |
| `revista-ia`, `conhecimento-ia`, `aulas`, `logos`, `series`, `screener` | nada além do que já existe |

Se mesmo assim faltar alguma chave, o Worker responde 503 e o app usa a função antiga do Supabase.
Observação: segredos de outros Workers (ex.: `diario-screeners-quant`) não são visíveis para o
`diario-trader` — a Cloudflare isola segredos por Worker.

## Fase C — próxima (precisa de adaptação de código)

| Item | Por que não entrou na fase B |
|---|---|
| `notificar`, `radar` | Push usa `npm:web-push` (APIs do Node). Reescrever com Web Crypto (VAPID) no Worker. |
| Rotinas agendadas: `rotina-cron`, `check-morning-status`, `email-semana`, `movimentos`, `insiders`, `screeners-*`, `daily-panorama`, `inbound-btg-note` | Hoje disparadas pelo agendador do Supabase. Mover para `triggers.crons` dos Workers. |
| `aulas-voz`, `aulas-visuais`, `daily-panorama`, `inbound-btg-note`, `insiders`, `adrs` (legado) | Dependem de pacotes `npm:` (supabase-js, resvg-wasm, unpdf, fflate, ws). |
| `conta` (excluir conta) | Opera Auth admin + Storage; migrar por último, com teste em conta descartável. |

Depois que cada função tiver rodado no Worker por alguns dias sem cair para o
Supabase, a função antiga pode ser desligada no painel do Supabase.

## Também nesta etapa
- Fim do teste automático das funções ao abrir **Conta** (≈14 chamadas ao
  Supabase a cada 6 h por aparelho, 6 delas com 404) e da checagem de versão
  no **Início**. O teste segue disponível no botão *Status do sistema*, sem as
  6 funções que já saíram do Supabase.
- Verificado: abrir o Início sem login faz **0** requisições ao Supabase.
