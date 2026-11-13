-- v601: o bucket privado "planilhas" passa a aceitar também o relatório de desempenho em PDF (anexo do e-mail de sexta).
-- Alteração aditiva: só acrescenta o tipo application/pdf; políticas por auth.uid() (pasta = uid) continuam as mesmas.
update storage.buckets
   set allowed_mime_types = array_append(allowed_mime_types, 'application/pdf')
 where id = 'planilhas' and not ('application/pdf' = any(allowed_mime_types));
