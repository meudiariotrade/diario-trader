# Migração Cloudflare v899 — inventário de segurança
A v899 remove chamadas diretas e contingências legadas do Supabase para dados públicos de Juros, Sentimento, ADRs e Notícias. Preços, Candles, EWZ e Macro já possuíam ponte na v894; o Macro nesta versão deixa também de renovar ou enviar JWT via `edgeFetchAutenticado`. A versão nova de Notícias utiliza o feed público compartilhado inclusive como reserva editorial, sem consultar a função antiga.

## Fluxos NÃO migrados nesta etapa por serem privados ou dependerem de sessão
- Supabase Auth: login, refresh, recuperação de senha; não eliminar antes de estabelecer outro mecanismo seguro e importar usuários.
- Persistência: `diario`, revisões, Operações, Carteira, arquivos, backups, notas, relatórios, fotos e demais tabelas privadas. Migrar requer exportação, validação de integridade, ACL e autenticação confiável no Cloudflare D1 ou equivalente.
- IA personalizada: `/functions/v1/analise` e `/functions/v1/pesquisa`, cujo estado histórico/usuário não deve ir ao GitHub público. Exige reimplementação com autorização e armazenamento privado.
- Notificações: `/functions/v1/notificar`, inscrições push e entregas, dependem de identidade e credenciais seguras.
- Voz na Cloudflare: `/v1/voz` ainda verifica login contra Supabase Auth em cache miss, por proteção contra abuso de Gemini TTS. Não remover sem verificação JWT local confiável ou autenticação substituta.
- Outras integrações antigas: rádar e cotações privadas de Profit, opções, rotinas fiscais e aplicativos que ainda consultam tabelas; exigem migração com compatibilidade.
- R2 ainda não ativado na conta Cloudflare no momento da auditoria. Não colocar dados privados nos arquivos `dados-publicos` do GitHub nem em KV público.

Regra: dado público → Cloudflare/GitHub e cache do navegador; dado privado → backend autenticado e armazenamento por usuário; nunca fallback automático para Supabase em dados de mercado. Sem consulta aos Logs/Analytics Supabase.
