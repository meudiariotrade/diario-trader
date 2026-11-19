# v787 — Fibonaccing macro, valuation composto e reconciliação

> Acréscimo à v787 original (contrato de feeds), sem retirar nenhuma das entregas anteriores.
> Não alterar CSS, layout de telas, identidade editorial dos PDFs, outras abas ou cota de Logs/Analytics do Supabase.

## Estrutura técnica
- ZigZag de pivôs confirmados com duas barras posteriores, escolhendo a perna dominante entre até **250 candles observados**.
- Escala orientada: início da perna = 0%, fim da perna = 100%. Níveis: -61,8/-41,4/-27,2/-11,8/0/23,6/38,2/50/61,8/76,4/100/111/127,2/141,4/161,8. Todos os preços devem permanecer >=0,01.
- A Zona de Defesa é retração **61,8%–76,4% medida a partir do extremo 100%**; quando a escala declara 0%=fundo e 100%=topo, os preços correspondem aos níveis 38,2%–23,6% da grade de alta. RMC 4-Barras e CISD se referem exclusivamente ao gatilho micro, não reancoram a grade. Em caso de pivôs macro insuficientes, não projetar valores.
- A linha clássica de **111,8%** aparece em algumas referências do método Marco Rossi, mas **1,110** foi mantida como parâmetro solicitado do aplicativo; a diferença fica explicitamente identificada como adaptação do projeto.
- Canvas PDF 1600x1000, corredor lateral exclusivo de 226 px para badges; espaçamento vertical mínimo de 22 px (>=16); desenho dos rótulos depois dos candles, nunca sobreposto ao gráfico. O modelo editorial (cores, fontes, páginas) permanece.
- A Pesquisa só imprime grade macro quando os 15 valores forem fornecidos por um cálculo comprovado; não inventa pivôs.

## Valuation e SQL (BR)
- Fonte documental preferencial: CVM/DFP/ITR e demonstrativos comprovados. *Valor de mercado/P-L* é lucro **TTM implícito**, nunca consenso/projeção.
- Fórmula própria: (lucro projetado comprovado OU lucro TTM implícito certificado) × payout / ações / 0,07.
- Bazin clássico: DPA 12m / 0,06; dinâmico: DPA médio recorrente certificado (3–5 anos) / 0,06; Graham: raiz(22,5×LPA×VPA), ambos positivos.
- Quatro métodos calculados independentemente. Margem composta = **média aritmética de 4 margens percentuais**.
- Novo escore de Valuation = 80% do pilar tradicional + 20% do novo componente `clamp(50 + margem_composta_percentual, 0, 100)`. O pilar permanece 30% do total; os pesos gerais 30/30/25/15 não mudam.
- `valuation_insumos_conferidos=true` **mais os quatro valores numéricos positivos** são obrigatórios. Sem prova, nenhum componente entra no score e o modelo permanece v2.0/v2.1-fin.
- O yield 6/7/8% configurável é para **simulação na interface**; o **score padronizado usa sempre 7%** para evitar mudanças não persistidas nas classificações.
- Campos adicionais são colunas públicas do conjunto **quant_br.acoes**, com RLS atual preservado. Sem migrations destrutivas, sem reset de dados, sem polling ou novos secrets.
- Funções SQL compatíveis com o JS: `public.quant_br_valor_composto`, `public.quant_v2_score`, recálculo em lotes, `quant_v2_compact` e universo público para snapshot Cloudflare. A migração **não executa recálculo global nem chama Logs/Analytics**.
- Para declarar “zero divergências” reais, é indispensável **aplicar migração e testar o mesmo fixture no banco**, depois comparar o snapshot público gerado pelo cron com JS. Até isso ocorrer, a sincronização não está homologada.

## Validação
`npm run build && npm run verify` e testes `tests/analises-v787-fibo-valuation.test.cjs`, comparação do resultado SQL sobre fixtures quando aplicado, PDF gerado em navegador com 15 rótulos visíveis e medição do peso no score. Preservar comportamento anterior se não houver dados.

## Referências
- <https://marcioportes.com.br/> — ancoragem, alvos e RMC
- <https://fibonaccing.eadplataforma.app/lesson/demo/545/16> — quatro barras e CISD
- <https://www.sec.gov/search-filings/edgar-application-programming-interfaces> — referência para auditoria EUA
