# v945 — Profit → Mercado: reconciliação de fonte e timestamp

## Evidência
Na auditoria de 23/11/2026, o Supabase `cotacoes` recebia 148 tickers de um usuário, com gravações atuais, enquanto o iPhone mostrava dados Profit de 23/11 às 00:31. Os registros operacionais confirmaram horários reais de negócio por volta de 18:05–18:31 BRT. A tabela `operacoes_profit` estava vazia (importação de trades é um fluxo distinto).

## Falha corrigida
- `profit-cotacoes-v552.js`: horário `updated_at` da gravação no Supabase era usado incorretamente como se fosse **hora do último negócio**. Um serviço que republica o fechamento pode gravar repetidamente mesmo sem haver novo preço negociado. A leitura agora usa `dat` + `hor` do Profit quando disponíveis, validando a data em São Paulo. `recebidoEm` guarda a hora da gravação separadamente; formatos ausentes continuam usando o carimbo legado como aproximação.
- `src/domains/core/13-diagnostico-e-relatorios.js`: antes, qualquer `CQ.saved` fora do pregão substituía incondicionalmente a referência TradingView. Agora, durante o pregão, só o Profit **efetivamente recente** tem prioridade. Após o pregão, uma cotação TradingView válida substitui o Profit encerrado, exceto quando for comprovadamente mais antiga que o último negócio do Profit. Se não houver referência TradingView, o fechamento Profit segue visível com **FECHADO** e horário.
- `src/domains/core/02-estado-e-persistencia.js`: Cotações ao vivo solicita a ponte ao entrar e oferece atualização explícita sem confundir falta de snapshot em tela com falha comprovada do PC.
- `src/index.html`: versiona o script Profit com a release para não carregar o módulo v552 antigo de cache.
- Ação humana `Atualizar` pode revalidar Supabase antes dos 15 minutos normais, com limite de uma tentativa por 15 segundos. Polling automático continua limitado a 15 minutos; não se cria polling de segundos no Supabase.

## Segurança e limitações
- Não altera banco, chaves, bridge Windows, ordens ou cálculos financeiros.
- Os dados de negócio fora do pregão não são declarados tempo real.
- `operacoes_profit` sem registros indica falta de dados recebidos por esse fluxo, não erro da tabela; verificar exportação CSV/ponte Python no PC separadamente.
- Não afirma que o timestamp `updated_at` corresponde a um negócio no mercado.
- Se não existir timestamp confiável da referência TradingView, o aplicativo pode exibir o último preço acompanhado da identificação de fonte, sem inventar nova operação/negócio.

## Homologação
- CI: teste da ponte e regras Profit/TradingView; build e validação do app.
- No iPhone: abrir Mercado > Cotações > Ações BR / Futuros, tocar ↻ e confirmar fonte e horário; comparar PETR4, VALE3, WIN e WDO após pregão.
- PC: Profit e ponte continuam enviando; separadamente conferir `operacoes_profit` somente se houver CSV de operações para importar.
