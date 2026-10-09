# Diário Trader (PWA)

App estático: `index.html`, `app.js`, `style.css`, `sw.js`, `manifest.webmanifest`, ícones e `config.js` (URL e chave pública do Supabase).

## 1) Colocar no GitHub (e abrir como site)
1. Crie uma conta em github.com e clique em **New repository**. Nome sugerido: `diario-trader`.
2. Na página do repositório vazio, clique em **uploading an existing file** e arraste TODOS os arquivos desta pasta (inclusive a pasta `supabase`). Clique em **Commit changes**.
3. Vá em **Settings → Pages**. Em *Build and deployment*, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`, e salve.
4. Em 1 a 2 minutos o site abre em `https://SEU-USUARIO.github.io/diario-trader/`.
5. No iPhone: abra o link no Safari → Compartilhar → **Adicionar à Tela de Início**. No Android (Chrome): menu → **Instalar app**.

Atenção: no plano gratuito, o GitHub Pages costuma exigir repositório público. O `config.js` só deve ter a URL e a chave **anon** do Supabase. **Nunca** coloque no repositório: chave `service_role`, BRAPI_TOKEN, TWELVE_KEY ou o APP_SECRET.

## 2) Atualizar o app depois
Troque os arquivos no repositório (Add file → Upload files, mesmo nome sobrescreve). Em `sw.js`, aumente o número em `diario-vNN` a cada versão, para o celular baixar a novidade. Depois feche e abra o app.

## 3) Preços automáticos (Supabase)
1. Crie conta grátis na **brapi.dev** (copie o token) e na **twelvedata.com** (copie a API key).
2. No painel do Supabase do seu projeto: **Edge Functions → Deploy a new function** (pelo editor). Nome: `precos`. Cole o conteúdo de `supabase/functions/precos/index.ts` e faça o deploy. (Os nomes dos menus podem mudar um pouco.)
3. Em **Edge Functions → Secrets**, crie:
   - `APP_SECRET`: uma senha que você inventa;
   - `BRAPI_TOKEN`: token da brapi;
   - `TWELVE_KEY`: key da Twelve Data;
   - `BRAPI_LOTE` (opcional): tickers por chamada na brapi; o padrão é 1.
4. No app: Mais → Carteiras → **Atualizar preços**. Na primeira vez ele pede o APP_SECRET.

Limites do plano gratuito da Twelve Data: 8 créditos por minuto. Com mais de 7 ações americanas, algumas voltam sem preço; toque de novo depois de 1 minuto. Tesouro não tem busca automática: digite o preço no cartão.

Este código não foi testado com chaves reais. Se algum preço não vier, a mensagem abaixo do botão mostra quais tickers falharam.
