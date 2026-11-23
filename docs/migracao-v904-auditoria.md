# Auditoria da migração Cloudflare — v904
Data: 23/11/2026. Sem consulta a logs ou Analytics do Supabase.

## Verificado no Cloudflare D1

- Banco: `diario-trader-privado`.
- Coleção `private_documents`: **2.453 documentos**, todos com `json_valid(payload)=1`, de 13 coleções que tinham registros.
- Coleções transferidas: `conhecimento_trading` (1.760), `profit_candles` (417), `cotacoes` (148), `noticias_urgentes_notificadas` (84), `analises_trabalhos` (10), `estado_diario` (8), `diario_backup` (8), `opcoes_grade` (7), `fluxo_acoes` (4), `aulas_fila` (3), `aulas` (2), `push_subs` (1), `atalhos_tokens` (1).
- Histórico dos dados principais: snapshot de `diario_snapshots` importado com revisão 1046. A revisão da origem avançou depois da importação: a v903 ativa D1 somente após confirmar paridade; se estiver atrasado, conserva o sincronismo antigo e espelha até alcançar.
- O Worker `diario-sync` atende o Diário e arquivos privados com identidade conferida em `/auth/v1/user` (Supabase Auth).

## Arquivos
- Cloudflare KV gratuito: namespace `DIARIO_ARQUIVOS_PRIVADOS`, ligado ao Worker.
- `private_files`: 46 metadados importados: 40 figuras de aulas, 4 backups, 2 fotos (3.152.830 bytes conforme metadados).
- **A transferência dos bytes está pendente até uma sessão de usuário válida conseguir ler os buckets privados.** Os registros no D1 são catálogo, não arquivos copiados. Não apague arquivos originais.
- O app v901+ substitui upload das fotos pelo KV e tenta importar objetos antigos autenticados. Arquivos de até 8 MiB no KV; livros/PDFs grandes mantidos no IndexedDB, com exportação/importação de backup local.

## Dependências do Supabase ainda presentes
Embora a migração dos dados armazenados no banco tenha sido concluída como *cópia pontual*, o **cutover funcional completo ainda não está concluído**:
1. A sincronização principal do Diário faz verificação inicial da última revisão no Supabase para não perder dados de aparelhos antigos. Só usa D1 quando a paridade é confirmada.
2. 28 tabelas foram catalogadas para migração, 13 tinham dados. Os consumidores existentes de tabelas como `carteira_cfg`, `weekly_reports`, `radar_cfg`, `opcoes_grade`, `operacoes_profit`, `analises_trabalhos` e `diario_backup` ainda usam rotas PostgREST antigas e precisam de substituição contratual com testes individuais.
3. Funções antigas `analise`, `resumo`, `notificar`, `radar`, `terminal`, `conta`, `parceiro-leitura`, `mesa-macro` e outras ainda têm dependências de Supabase. Não foram desativadas para evitar perda de funcionalidades. Dados de mercado públicos já usam as rotas Cloudflare.
4. Os registros de 13 coleções copiados são consistentes na hora da leitura; escritas futuras em clientes antigos podem exigir nova reconciliação até o cutover de cada consumidor.

## Regras de segurança
- Não remover Auth, senhas ou contas. Nunca publicar conteúdo privado no GitHub público.
- Não apagar dados ou buckets antigos antes de uma comparação final por proprietário e testes reais em iPhone/PC.
- Não enviar mídia grande ao D1, GitHub público ou ao KV. Exportar backups locais.
- Não consultar `edge_logs`, `postgres_logs`, Analytics ou logs do Supabase.
- Usar apenas serviços disponíveis no plano gratuito: Cloudflare D1 + KV + Workers e IndexedDB.

## Pontos de verificação
- Cloudflare Worker: `diario-sync` com DB e FILES_KV vinculados, deployment automático via Wrangler 4.
- GitHub CI: `npm run build && npm run verify`, versões estritamente crescentes.
- D1: `SELECT collection,count(*),sum(json_valid(payload)) FROM private_documents GROUP BY collection;`
- KV: `SELECT status,count(*) FROM private_files GROUP BY status;`
- Não reivindicar "Supabase só login" enquanto as rotas listadas acima permanecerem ativas.
