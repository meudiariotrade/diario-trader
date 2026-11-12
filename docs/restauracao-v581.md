# Restauração e preservação

A baseline é apenas estrutura, sem dados privados. Só aplicar a um projeto Supabase vazio. Auth, Storage e extensões gerenciadas devem estar disponíveis. Os jobs restaurados ficam inativos até configurar os segredos no Vault e verificar permissões.

1. Aplicar a baseline e a migração aditiva de Análises.
2. Configurar variáveis privadas no servidor e `diario_cron_secret` no Vault, sem colar valores no Git.
3. Aplicar a consolidação de rotinas somente após revisar as políticas equivalentes. Validar assinaturas das funções e as condições de fila.
4. Executar o SQL de isolamento, que usa fixtures sintéticas e ROLLBACK.
5. Exportar um backup integral pelo mecanismo existente `TraderBackup`, preservar o arquivo original e seu checksum. Restaurar apenas em uma conta/ambiente de teste.
6. Conferir contagens de operações, dias, regras, livros, lançamentos e anexos; verificar checksum e referências antes de ativar jobs. Falha de integridade deve impedir escrita.
7. Só depois conferir sincronização entre aparelhos e uma exportação da mesma edição em tela/PDF/imagem.

Não apagar mídia pela idade. Vídeos, imagens e áudios permanecem preservados até verificar referências e existir backup testado. Não foi aplicado novo descarte de cron.job_run_details, relatórios ou anexos. Permanecem as políticas existentes de caches e filas, descritas na baseline e nos jobs. A retenção de cada classe deve ter finalidade e restauração verificáveis antes de uma limpeza adicional.

O teste transacional de RLS e jobs não comprova restauração de um backup integral nem dos arquivos de Storage. Essa homologação permanece identificada como pendente.
