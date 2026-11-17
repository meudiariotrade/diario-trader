# v740 — Reserva gratuita do Jornal via OpenRouter

- Preservar primeiro Google Gemini, modelos e ordem atual das demais abas.
- Quando a busca Gemini falhar na edição textual do Jornal, tentar OpenRouter Reserva antes dos outros provedores do roteador. Reservas sem pesquisa online recebem apenas os fatos coletados pelo aplicativo; nunca afirmar pesquisa web inexistente.
- Ordem pedida: DeepSeek V4.1 Flash / 1017, GLM 5.3 Flash, Grok 4.5 / 4.7, MiMo 2.6 (somente variantes com sufixo `:free` e preço comprovadamente zero no catálogo `/api/v1/models`).
- Em 17/11/2026 nenhuma das quatro famílias solicitadas tinha opção text-to-text `:free` no catálogo consultado. Grok 4.5/4.7 existiam apenas como modelos pagos. Reservas gratuitas adicionais verificadas: NVIDIA Nemotron 3.5 Lightning, Google Gemma 4 31B, entre outras. O roteador as descobre dinamicamente e respeita o orçamento de tempo.
- Não presumir gratuidade se o catálogo falhar. Não habilitar Grok pago, compras automáticas, alterações de modelos primários, UI, prompts/editorias, PDF nem dados do Diário.
- Diagnóstico interno protegido `cron_diagnostico` responde somente booleans `openrouterConfigurado` e `geminiConfigurado`; não expõe chaves, e nunca gera edição. Se OPENROUTER_API_KEY não estiver no Supabase, configurar manualmente no painel Secrets, sem commitar credencial.
- Testes: `npm run verify`, `tests/jornal-openrouter-gratis-v740.test.cjs`, `tests/jornal-reserva-v720.test.cjs`, `tests/ai-router-reserva-v713.test.cjs`. Após merge, publicar a Edge Function `analise` mantendo todos os arquivos atuais, e testar o diagnóstico autenticado sem geração. O envio automático do Jornal permanece com a periodicidade e layout atuais.
