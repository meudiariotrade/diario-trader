# v905 — Correções do Resumão da Áurea e Panorama no iPhone

## Regressão: botão da Áurea
A v898 transformou o botão **Gerar resumão com a Áurea** em um comando que apenas copiava o prompt ao clipboard para proteger a franquia do Supabase. A v905 restaura a **resposta dentro da tela Início**: usa `/v1/aurea-resumao` no Worker Cloudflare screeners, que já tinha a chave Gemini configurada. A solicitação só é aceita com sessão válida verificada **exclusivamente pelo Supabase Auth**. Nenhuma posição completa, saldo, histórico de trades, arquivo ou conteúdo de PDF é enviado ao Worker: o contexto inclui somente tickers acompanhados, instantâneos de mercado, manchetes e agenda já presentes na interface. Os dados não entram em cache público. Limite diário de requisições para evitar exceder o free tier.

Se a IA gratuita estiver indisponível ou a sessão expirar, o botão ainda apresenta um resumo **calculado no dispositivo**, identificado explicitamente como `IA temporariamente indisponível`; esse texto não é atribuído ao modelo Gemini. Não existe mais popup de "resumão copiado".

## Regressão: Panorama/Imagem em rede instável
O gerador tentava novas consultas de Macro e ADR mesmo com snapshots anteriores no dispositivo. Na v905, ele aguarda de forma limitada, aceita a última leitura válida e, quando houver dados antigos/parciais, acrescenta um rodapé destacado **na imagem compartilhável**: `DADOS PARCIAIS / CONSULTA ANTERIOR` com horário em Brasília. O aviso não cobre a imagem. Em indisponibilidade total não aparecem números inventados.

O gerador não exibe `alert` nem `confirm` quando o problema é um fetch interrompido: apenas um aviso não bloqueante quando a imagem realmente não pode ser convertida. Não foram alteradas abas, layout do Mercado, cálculos de risco ou dados pessoais.

## Segurança e validação
- Só Supabase Auth: validação/renovação de login. Sem `/functions/v1/analise`, Rest ou Storage nos dois novos fluxos.
- Todos os dados financeiros públicos permanecem em Cloudflare. O Worker usa os modelos `gemini-3.8-flash` e `gemini-3.5-flash-lite` no plano/quotas já configurados e não ativa cobrança.
- Testes: `tests/v904-aurea-panorama.test.cjs`, `tests/v898-fiis-sem-supabase.test.cjs`, e suíte completa `npm run verify`.
- Os alertas capturados podem estar também em uma instalação PWA desatualizada; a versão 905 renova bundles/cache via versionamento. Não afirmar que todos os cenários de 5G/iPhone foram reproduzidos sem teste em dispositivo real.
