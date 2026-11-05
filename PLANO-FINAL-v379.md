# Fechamento e aprovação — Diário de Trader v379

## 1. Estado
- Release v378 encontrada em GitHub `main`; v379 preparada localmente.
- O link do parceiro permanece operativo pelo RPC antigo até a migração.
- A tentativa de criar branch de limpeza via integração retornou HTTP 403.
- PDFs reais e testes de iPhone dependem dos resultados já coletados pelo usuário.

## 2. Checklist para publicar sem perder dados
1. Faça backup da carteira e exporte o Diário antes de alterar a hospedagem.
2. Crie branch de homologação no GitHub e substitua com v379 (arquivo cumulativo).
3. Confirme versão v379 no Diagnóstico, Service Worker, Jornal, Giro e Terminal.
4. Verifique novo fluxo de leitura de link antigo antes do deploy Edge.
5. Configure e teste `parceiro-leitura` no Supabase **sem** revogar `parceiro_ver`.
6. Compare relatórios com CVM / RI, validando moeda, data, trimestre e YTD/TTM.
7. Execute o script `scripts/auditar-limpeza-v379.cjs` em um checkout completo
   antes de eliminar PNGs duplicados. Não apague por nome semelhante apenas.
8. Ative proteção de senhas comprometidas no painel Auth do Supabase, se disponível.
9. Quando o cliente atualizado e Edge estiverem validados, revogue o RPC legado.
10. Após verificação com aparelho real, publique e monitore sem perder rollback.

## 3. Regra de aceitação (100%)
100% somente com: upload consistente, links antigos e novos funcionando ou
revogados corretamente, auditoria de segurança sem pendências críticas, 
comparação financeira com fontes oficiais, iPhone sem travamentos, backup
restaurável e ausência de erros relevantes após publicar.

## 4. Observações sobre limpeza
O GitHub ainda mantém pares de PNG com SHA Git idêntica. Os PNGs `card-*.png`
e seus aliases simples podem ser usados por módulos antigos ou links externos.
A versão distribuída já carrega as imagens atuais `.jpg`. A remoção fica sujeita
à conferência de referências em checkout completo e aprovação de merge.
