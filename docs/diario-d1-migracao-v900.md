# v900 - Migração segura do Diário ao Cloudflare D1

Banco: diario-trader-privado (Cloudflare D1 Free). Tabela diario_snapshots por user_id, com controle de revisão, marca temporal e payload privado.

O Worker diario-sync autentica a sessão junto ao Supabase Auth em /auth/v1/user; não tem service_role, não consulta tabelas Supabase nem grava em GitHub. CORS somente da origem oficial. GET e PUT exigem sessão, não há DELETE.

O navegador só faz cópia do JSON consolidado do Diário, incluindo Operações e Carteira, **depois** de sincronização bem-sucedida no Supabase atual. O código não lê o conteúdo de outros usuários; a identidade vem exclusivamente do token validado no Auth.

**Atenção:** fase ESPÊLHO, não corte definitivo. Não desativar o antigo backend, fotos, backup e rotinas dependentes antes de verificar a migração em mais de um aparelho. D1 não é um substituto gratuito do R2 para imagens grandes. Nenhum arquivo privado vai para GitHub.

Próximas etapas: validar funcionamento real com sessão; comparar conteúdo e revisões; migrar fotos ao IndexedDB e criar exportação segura; substituir demais tabelas privadas, notificações e IA; cortar Supabase DB deixando apenas Auth. Nunca consultar Logs/Analytics Supabase.
