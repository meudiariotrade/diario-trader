# v799 — Circuit breaker de Egress para snapshots públicos

Falha da Cloudflare **não dispara leitura direta individual** de `screeners-quant` no Supabase. O cliente usa o último snapshot local no IndexedDB, sinalizando `Histórico / Desatualizado` quando excede a SLA; PDF automático homologado continua bloqueado nesse estado. Sem cache, erro explicativo e nenhuma carga súbita sobre a origem. Requests GET de fundamentos públicos só aceitam o Worker HTTPS configurado em `*.workers.dev`, com `If-None-Match` para evitar baixar payload igual.

Essa versão reduz o risco de explosão de Egress na indisponibilidade da borda. Não afeta Auth, persistência privada, operações ou outras abas; nenhuma leitura de Logs/Analytics foi realizada. O Worker independente e sua configuração de cache não são publicados por esta alteração do PWA.

Revisão de integração CI: versão preparada sobre a cadeia cumulativa atual e direcionada à `main`; alterações de outras abas devem permanecer inalteradas.
