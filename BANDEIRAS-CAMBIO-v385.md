# Diário de Trader v385 — Pares de moedas

## Objetivo
Exibir duas bandeiras circulares sobrepostas em cotações de câmbio no estilo de leitura do mercado: moeda base à esquerda e moeda cotada à direita. Exemplo: `AUDCAD` = Austrália / Canadá; `USDCAD` = EUA / Canadá. São bandeiras nacionais, **não arquivos oficiais do TradingView**.

## Regras da integração
- O código reconhece pares de 3+3 caracteres, como `EURUSD`, `AUDCAD`, `USD/BRL`, `GBP/JPY`, e os prefixos aceitos (`OANDA:USDCAD`).
- Mapeamento de **64 códigos monetários em 63 bandeiras**. Outras combinações das moedas cadastradas funcionam automaticamente, sem cadastrar o par manualmente.
- Identificação explícita evita confundir `DXY`, `USOUSD`, `XAUUSD`, `BTCUSD`, `WIN` e `WDO` com pares cambiais fiduciários.
- Ao falhar a imagem, aparecem os códigos ISO de cada lado; os preços e variações permanecem intocados.
- Bandeiras locais `logos/fx/*.png`; 20 principais entram no cache offline inicial e as demais entram no cache sob demanda.
- Avatar é reutilizado em listas, Radar, Carteira, prévias HTML e em exportações baseadas em canvas. O PDF profissional individual recebe as duas imagens quando o ticker é FX e ambas são obtidas no mesmo domínio.
- A imagem do **índice do dólar (DXY)** continua própria; não é tratada como par.

## Fonte e atribuição
Ícones de bandeiras dos países renderizados a partir dos glifos de bandeiras da fonte **Google Noto Color Emoji** (projeto `googlefonts/noto-emoji`). O pacote inclui somente as imagens PNG exportadas, **nenhum arquivo de fonte**. O projeto Noto Emoji possui componentes sob Apache License 2.0; a fonte distribuída em Debian usa SIL Open Font License 1.1. © 2013–2017 Google Inc. e colaboradores. Consulte `https://github.com/googlefonts/noto-emoji` e `https://scripts.sil.org/OFL` para as respectivas condições.

As bandeiras são representações dos países/regiões associados à moeda. O EUR usa a bandeira da União Europeia; o CNH compartilha a bandeira chinesa com o CNY. Não são certificados de negociação, bandeiras de países específicos para cestas multirregionais nem logotipos de uma corretora.

## O que conferir no iPhone
1. Localize `USDCAD`, `AUDCAD`, `AUDUSD` em cotações — duas bandeiras, ordem correta, sem texto sobreposto.
2. Teste `EURUSD`, `USDJPY`, `USDCHF`, `USDBRL` e algum par menos comum.
3. Compare os preços e percentuais antes/depois; os dados devem ser idênticos.
4. Gere ou visualize um PDF de ativo cambial. Se alguma bandeira falhar, confirme que o relatório é concluído e o texto permanece visível.
5. Use modo avião após abrir a lista para confirmar cache dos símbolos mais comuns.
