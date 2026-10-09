# Diário Trader (PWA)

App estático: `index.html`, `app.js`, `style.css`, `sw.js`, `manifest.webmanifest`, ícones e `config.js` (URL e chave pública do Supabase).

## 1) Colocar no GitHub (e abrir como site)
1. Crie uma conta em github.com e clique em **New repository**. Nome sugerido: `diario-trader`.
2. Na página do repositório vazio, clique em **uploading an existing file** e arraste TODOS os arquivos desta pasta (inclusive a pasta `supabase`). Clique em **Commit changes**.
3. Vá em **Settings → Pages**. Em *Build and deployment*, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`, e salve.
4. Em 1 a 2 minutos o site abre em `https://SEU-USUARIO.github.io/diario-trader/`.
5. No iPhone: abra o link no Safari → Compartilhar → **Adicionar à Tela de Início**. No Android (Chrome): menu → **Instalar app**.

Atenção: no plano gratuito, o GitHub Pages costuma exigir repositório público. O `config.js` só deve ter a URL e a chave **anon** do Supabase. **Nunca** coloque no repositório: chave `service_role`, BRAPI_TOKEN, TWELVE_KEY .

## 2) Atualizar o app depois
Troque os arquivos no repositório (Add file → Upload files, mesmo nome sobrescreve). Em `sw.js`, aumente o número em `diario-vNN` a cada versão, para o celular baixar a novidade. Depois feche e abra o app.

## 3) Preços automáticos (Supabase)
1. Crie conta grátis na **brapi.dev** (copie o token) e na **twelvedata.com** (copie a API key).
2. No painel do Supabase do seu projeto: **Edge Functions → Deploy a new function** (pelo editor). Nome: `precos`. Cole o conteúdo de `supabase/functions/precos/index.ts` e faça o deploy. (Os nomes dos menus podem mudar um pouco.)
3. Em **Edge Functions → Secrets**, crie:
   - `BRAPI_TOKEN`: token da brapi;
   - `TWELVE_KEY`: key da Twelve Data;
   - `BRAPI_LOTE` (opcional): tickers por chamada na brapi; o padrão é 1.
4. No app: entre na sua conta (Mais → Conta) e vá em Mais → Carteiras → **Atualizar preços**. Cada amigo usa a própria conta; a função só responde a quem está logado. Não existe senha compartilhada.

Atenção: a cota gratuita das APIs é dividida entre todos que usam o app, e os planos gratuitos costumam ser para uso pessoal. Leia os termos da brapi e da Twelve Data antes de abrir para muita gente.

Limites do plano gratuito da Twelve Data: 8 créditos por minuto. Com mais de 7 ações americanas, algumas voltam sem preço; toque de novo depois de 1 minuto. Tesouro não tem busca automática: digite o preço no cartão.

Este código não foi testado com chaves reais. Se algum preço não vier, a mensagem abaixo do botão mostra quais tickers falharam.

## 4) Análise com IA (Gemini + Grok)
Em **Mais → Análise IA** o app gera relatórios da carteira com dois analistas de IA, cada um só na sua área:
- **📈 Técnica (Gemini)**: tendência, pivôs **diários e semanais** (clássico, Fibonacci e Camarilla), médias, RSI, ATR e volume, com gráfico de candles e os níveis desenhados. Cotações da brapi (Brasil) e Twelve Data (EUA). Não comenta fundamentos.
- **🏦 Fundamentos (Grok)**: rentabilidade, margens, endividamento, dividendos, valuation e consenso de analistas, com os dados do Yahoo Finance. Não comenta gráfico.
- **🖼️ Foto**: envie um print ou foto de um gráfico e o analista técnico (Gemini) lê tendência, níveis e padrões. Se informar o ticker, o app junta os pivôs calculados com dados reais.

Os pivôs e indicadores são calculados em código (não pela IA); a IA só interpreta os números. Ações, ETFs e FIIs entram; Tesouro e renda fixa ficam de fora. Até 12 ativos por relatório.

### Como ativar
1. Crie as chaves: **Gemini** em aistudio.google.com (API key) e **Grok** em console.x.ai (API key).
2. No Supabase: **Edge Functions → Deploy a new function**, nome `analise`, cole o conteúdo de `supabase/functions/analise/index.ts` e faça o deploy (mantenha a mesma opção de "Verify JWT" usada na função `precos`).
3. Em **Edge Functions → Secrets**, crie `GEMINI_API_KEY` e `XAI_API_KEY`. `BRAPI_TOKEN` e `TWELVE_KEY` são os mesmos da função de preços.
   Opcionais: `GEMINI_MODEL` (padrão `gemini-3.8-flash`), `XAI_MODEL` (padrão `grok-4.7`) e `BRAPI_RANGE` (padrão `3mo`). Se um modelo for aposentado, é só trocar o nome no Secret.
4. Suba `app.js`, `style.css` e `sw.js` no GitHub (o `sw.js` já vem com `diario-v21`). Feche e abra o app.

### Limites e cuidados
- **brapi gratuita**: histórico de 3 meses, 1 ticker por chamada e atraso de cerca de 30 min. Por isso a média de 200 períodos fica "sem dado" (a de 20 e a de 50 funcionam). Em plano pago, defina `BRAPI_RANGE=1y`.
- **Twelve Data gratuita**: 8 créditos por minuto; com muitas ações americanas, alguns ativos podem falhar. Gere de novo depois de 1 minuto.
- **Yahoo Finance não tem API oficial**: o acesso pode ser bloqueado ou mudar sem aviso, e os termos do Yahoo restringem uso automatizado. Se falhar, o app mostra quais ativos ficaram sem dados e a IA não inventa números.
- **Custo e cota**: as chaves de IA ficam no Supabase e valem para todas as contas que usam o app. Cada relatório consome cota do Gemini/Grok; ao abrir para amigos, acompanhe o uso nos painéis das duas plataformas.
- O conteúdo é gerado por IA, pode conter erros e **não é recomendação de investimento**.
- Este código foi testado só com respostas simuladas das APIs, não com chaves reais. Se algo falhar, a mensagem na tela diz o motivo.
