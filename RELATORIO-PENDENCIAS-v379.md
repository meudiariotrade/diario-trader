# Pendências de homologação após v379

## Funcionalidade e qualidade do produto
- Os testes locais verificam cálculos, arquivos, bibliotecas PDF, calendário,
  comportamentos determinísticos de cache e políticas do cliente.
- Não foi possível executar Chromium com carregamento real de tela no ambiente
  atual, nem simular sensores e configurações reais de iOS.
- PDFs com carteira e demonstrações oficiais precisam de validação com fonte CVM/RI.

## Segurança Supabase
- O RPC `public.parceiro_ver(t text)` permanece SECURITY DEFINER e pode ser
  invocado anonimamente. A migração para `parceiro-leitura` requer implantação,
  atualização do cliente e testes de revogação ANTES de revogar o RPC legado.
- RLS habilitado sem policies em tabelas internas pode ser intencional; analisar
  grants e fluxo das Edge Functions antes de abrir acesso.
- Proteção contra senhas comprometidas depende de configuração do Auth no dashboard.

## GitHub
- PNGs duplicados historicamente presentes são candidatos à limpeza,
  sem exclusão automática. Usar `scripts/auditar-limpeza-v379.cjs` num checkout
  completo para identificar duplicatas byte a byte e referências reais.
- Arquivos como `cards-assets.js` e o sourcemap merecem revisão separada.

**Não confundir 100% do pacote entregue com 100% de funcionamento homologado.**
