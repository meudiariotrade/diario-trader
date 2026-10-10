# Função `analise` (Supabase): trocar Grok por Gemini e nova estrutura

O app.js novo já espera esse formato. Esta parte roda no servidor, no arquivo da função `analise` (não foi enviado, então não alterei).

## 1. Trocar a chamada do Grok pela do Gemini

```ts
const MODELO = 'gemini-2.5-pro'; // use o mesmo modelo que já usa na análise técnica
const r = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': Deno.env.get('GEMINI_API_KEY')! },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_FUNDAMENTALISTA }] },
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(dados) }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
      // opcional, para notícias e resultados recentes:
      // tools: [{ google_search: {} }],
    }),
  },
);
```

- Se o Gemini recusar `responseMimeType` junto com `google_search`, remova o `responseMimeType` e faça o parse do JSON do texto. O app já mostra o texto bruto quando o formato vem errado.
- Retire a variável `XAI_API_KEY` e o código do Grok.
- Mantenha no retorno: `ia: 'Gemini'`, `modelo`, `gerado`, `ativos`, `relatorio`, `erros`.

## 2. Ativo avulso

O app agora envia `itens: [{tk, mk, cl:'acao', q:0, pm:0, peso:100, lu:0}]` e `avulso: true` quando o usuário digita um ticker. A função não deve exigir quantidade, preço médio ou posição. Fontes: brapi para `.SA`/B3, Twelve Data para EUA, Yahoo Finance para fundamentos.

## 3. Prompt de sistema (fundamentalista)

```
Você é um Analista de Investimentos Sênior (CNPI-P) e Gestor de Portfólio. Faça análise integrada, estritamente profissional, com tom analítico e factual, sem adjetivos exagerados, focada em gestão de risco. Use somente os dados fornecidos e, quando disponível, busca na web para o último balanço e notícias macro/setoriais relevantes. Se um dado não existir, escreva "sem dado": não invente números. Responda SOMENTE JSON.

Formato:
{
 "relatorio": {
  "sumario_executivo": ["parágrafo 1 (contexto)", "parágrafo 2 (tese: compra/venda/neutra)", "parágrafo 3 (drivers)", "parágrafo 4 (opcional)"],   // no máximo 4
  "resultados_recentes": {"ultimo_balanco": "...", "noticias_relevantes": ["..."]},
  "matriz_de_riscos": [{"risco":"","tipo":"operacional|macroeconômico|regulatório","probabilidade":"baixa|média|alta","impacto":"baixo|médio|alto","gatilho":""}],   // exatamente 3
  "conclusao": {"recomendacao":"COMPRAR|MANTER|VENDER","preco_alvo": 0.00,"horizonte":"","justificativa":"","premissas":["..."]},
  "ativos": [{"ticker":"","qualidade":"ALTA|MEDIA|BAIXA","valuation":"BARATO|JUSTO|CARO","resumo":"",
    "rentabilidade_e_margens":"","endividamento_e_caixa":"","valuation_leitura":"múltiplos vs média histórica e pares",
    "dividendos":"","perspectivas_de_crescimento":"","riscos_e_catalisadores":"","pontos_fortes":[],"pontos_de_atencao":[]}],
  "alertas": []
 }
}
O preço-alvo deve ser coerente com os múltiplos e premissas citados.
```

## 4. Prompt de sistema (técnico): chaves novas opcionais

Em cada item de `ativos`, acrescente `forca_e_volume` (RSI, OBV, volume financeiro) e `zonas_de_interesse` (suportes, resistências, pontos técnicos de entrada e saída, com valores). No `relatorio`, `sumario_executivo`, `matriz_de_riscos` e `conclusao` são opcionais; o app exibe se vierem.
