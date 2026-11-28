# Desempenho — medições da v1054 (Etapa 6)

Medido no Chromium, com os arquivos locais servidos na origem oficial
(`meudiariotrade.github.io/diario-trader/`), 1440×900, sem login.

## Timers (CLAUDE.md §8.3)
- Na abertura sobem ~18 `setInterval` curtos (500–800 ms) que **esperam a
  tela montar e se encerram sozinhos**.
- Depois de navegar por Trades, Mercado, Estudos e Início, ficam **2**
  ativos: o relógio central de 1 s (`dt983SetInterval`) e a conferência da
  ficha de ativo a cada 30 s (`src/shared/ficha-ativo.js`, pausa com a aba
  oculta). Nenhum timer consulta o Supabase.

## Vazamento ao trocar de aba
5 voltas completas pelas 8 abas principais, com coleta de lixo entre as medições:

| | 1 volta | 5 voltas |
|---|---|---|
| Nós do DOM | 3.046 | 3.052 |
| Ouvintes de evento | 1.162 | 1.158 |
| Heap JS | 13,0 MB | 14,1 MB |

Estável: as telas desmontam corretamente (CLAUDE.md §6). Os ~2.200
`addEventListener` do código são, em sua maioria, delegados no `document`
uma única vez, e não por tela.

## Peso da carga inicial
| Arquivo | Bruto | gzip |
|---|---|---|
| `nucleo-v560.js` | 3,13 MB | 1.068 KB |
| `camadas-v560.js` | 1,71 MB | 586 KB |
| `estilo-v560.css` | 0,91 MB | 154 KB |

Encurtar nomes e comprimir com o terser (`compress` + `mangle`) reduziria
só ~1% (1.068 → 1.060 KB gzip), porque o código-fonte já é compacto.
**Ganho real exige carregar cada aba sob demanda** (dividir `src/app-core.js`
e `src/app-layers.js` por domínio, como já é feito com `estudos.js`,
`arte.js`, `cnpi.js` e `ingles.js` em `release.config.json → lazy`). Depois
do primeiro acesso, o service worker serve tudo do cache do aparelho.

Próximo passo sugerido: mover Estudos/Research/IR/Terminal para bundles
`lazy` próprios, com teste de navegação para cada rota.

## Corrigido nesta etapa
- Painéis do Mercado (Índices, Emergentes, Commodities, Treasuries) ficavam
  em "Consultando…" para sempre quando a Mesa Macro falhava ou exigia login.
  Agora mostram o motivo e uma ação ("Entrar" ou "Tentar de novo").
