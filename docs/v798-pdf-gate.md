# v798 — Gate de exportação e metadados editoriais

O **PDF automático** só é emitido pelo fluxo normal do aplicativo com exatamente dez ativos, score matematicamente reconciliado (`diferença <=0,1`) e diagnóstico validado na versão correspondente. Isso evita exportação de um Top10 “homologado” com entradas não conferidas. Exportações manuais continuam disponíveis com suas advertências e valores ausentes.

A composição visual do PDF — capa, cores, fontes, quadros e páginas existentes — permanece idêntica. Apenas os metadados não visuais (`Subject`, `Keywords`) incluem SHA-256 do snapshot e versão de metodologia atualizada de v768 para v798; a linha editorial de rodapé já existente conserva posicionamento e estilo.

Validação de integração: executar CI no PR direcionado à `main`, preservando todas as versões anteriores da cadeia e os módulos de Checklist/Operações publicados na v789.
