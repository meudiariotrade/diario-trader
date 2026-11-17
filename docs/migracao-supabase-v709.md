# Migração Supabase v709 — estado e segurança

## Destino
- Projeto pretendido: `vdzwydizostutukppcsj`
- API URL: `https://vdzwydizostutukppcsj.supabase.co`
- Arquivo de referência: `.env.example` (somente publishable; sem token)
- **Não ativado:** a conexão Supabase desta sessão recusou acesso ao novo project-ref. O site mantém `config.js` antigo para evitar quebra de login/dados.

## Condições obrigatórias para ativar
1. Autorizar o **novo projeto** na conexão Supabase do ChatGPT, ou executar o CLI em ambiente autenticado com credenciais privadas.
2. Confirmar o backup dos dados do banco antigo, usuários Auth, buckets e configurações de login. `db push` cria o esquema; **não migra usuários nem os registros existentes automaticamente**.
3. Aplicar as 17 migrations versionadas em `supabase/migrations/` no projeto de destino e testar RLS e acesso REST por usuário. Conferir se a baseline depende de roles, extensões e funções já presentes.
4. Publicar as Edge Functions de `supabase/functions/`, incluindo `resumo`, `aulas`, e dependências `_shared`; configurar no painel novo os secrets de IA e provedores externos. **Nunca** copiar as service_role keys para arquivos do cliente ou GitHub.
5. Validar login, diário, carteira, resumos, aulas e Profit local no projeto novo com usuários reais migrados, preservando dados antigos.
6. Só então trocar o `config.js` publicado e as variáveis `DIARIO_SUPA_URL` e `DIARIO_SUPA_PUBLISHABLE_KEY` da ponte, incrementar release/build conforme `CLAUDE.md` e publicar.

## Armazenamento de Estudos v709
- PDFs e resultados de resumos: IndexedDB via `EstudosLocal`; somente trechos de texto vão à Edge Function para geração por IA.
- MP4 do PC: cache no computador + servidor loopback `127.0.0.1:8766`; no PC, o app pode baixar diretamente para IndexedDB. No iPhone, importe o MP4 ou backup JSON; loopback no iPhone não acessa o PC.
- A nova geração de PDFs **não usa** os buckets `livros` e `aulas-videos`. A migração manual dos arquivos antigos pode gerar transferência **uma única vez**.
- Outros endpoints de Supabase ainda transferem dados: **não** afirmar Egress global igual a zero.

## Segurança
- O access token enviado pelo chat deve ser revogado e substituído por token de escopo mínimo.
- Não comitar `.env`, `config.json` local da ponte, access tokens ou credenciais de serviço.
- Não apagar os dados do projeto antigo antes de comparar contagens de tabelas, usuários, anexos e confirmar o plano de rollback.
