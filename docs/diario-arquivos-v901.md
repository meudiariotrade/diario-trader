# v901 — Cofre gratuito de fotos e documentos

**Cloudflare KV:** namespace DIARIO_ARQUIVOS_PRIVADOS, 1 GB total gratuito. 100.000 leituras e 1.000 escritas/dia na faixa Free (regras podem mudar). Cada arquivo permitido neste Worker deve ter até 8 MiB. Limite de 100 MiB por usuário para preservar a franquia. Não há R2.

**Proteção:** Worker diario-sync só atende arquivos depois de validar o JWT no Supabase Auth. Os nomes das chaves são particionados por usuário, e o banco private_files tem metadados por proprietário. O cliente não tem credenciais Cloudflare, e o Worker não usa Service Role. CORS restrito ao GitHub Pages oficial. Sem acessos anônimos, listagem pública nem DELETE.

**Migração:** os 46 objetos dos buckets privados (aulas-figuras, backups e fotos) estão catalogados em D1 sem conteúdo. Depois que o usuário autenticado abrir a v901 e sincronizar o Diário, o cliente tenta importar os arquivos pelo Worker, usando uma leitura autenticada no Storage antigo e uma gravação privada em KV. Um arquivo só é marcado pronto se a cópia ao KV funcionar. Objetos cujo acesso antigo foi recusado não são apagados e permanecem pendentes. Backups associados a outras contas só podem ser importados por essas contas.

**Fotos do Diário:** a função photos usa o Blob local do IndexedDB e envia ao KV quando necessário. Sem cópia local, tenta carregar o KV; se não estiver disponível, tenta importar do Storage legado uma única vez. Não realiza gravações no Supabase Storage.

**Livros e arquivos grandes:** EstudosLocal (IndexedDB) permanece a solução local já existente, com exportação e importação de backup JSON. Não colocar PDFs volumosos no D1 nem no KV. A pessoa precisa exportar backups para não perder conteúdo se limpar os dados do navegador.

**Status:** Fotos/arquivos ainda precisam passar por importação autenticada no navegador; metadados no D1 não são bytes migrados. O Diário principal permanece protegido durante cutover do banco. Não apagar os buckets antigos antes de verificar os totais e bytes, por usuário.

**Verificações:** testes com usuários distintos, leitura/gravação KV, importação legacy somente por GET e proteção contra excesso. Não consultar Logs/Analytics do Supabase.
