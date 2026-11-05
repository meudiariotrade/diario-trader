# Checklist de homologação — Diário de Trader v379

## Instalação
- [ ] Backup do Diário e repositório; publicar ZIP completo em branch de homologação.
- [ ] Conferir `v379` no aplicativo após abrir/fechar o PWA e atualizar cache.
- [ ] Verificar que não há arquivos da v377 servidos por cache antigo.

## Panorama e dados
- [ ] 03/11/2026 (dia normal) não mostra abertura teórica.
- [ ] 20/11/2026 (feriado da B3): se NYSE aberta e ADRs reais suficientes, estimativa pode aparecer.
- [ ] Data/horário da fonte e moeda explícitos nas cotações; não são recomendação de investimento.

## iPhone e Terminal
- [ ] Abrir `?diagnostico=1`, copiar resumo e compartilhar JSON pelo iOS.
- [ ] Reabrir sem `diagnostico=1`: painel não aparece.
- [ ] Abrir Terminal, mudar Workspace, navegar até Diário e voltar sem travar.
- [ ] Testar estabilidade, notificações, rolagem, zoom e modo tela cheia.

## Carteira, PDFs e editorial
- [ ] Gerar PDF individual e consolidado com uma empresa com balanço já divulgado.
- [ ] Comparar números com CVM/RI e conferir YTD, TTM, 4T calculado e conflitos.
- [ ] Conferir revista de fim de semana, Jornal do Pregão, Giro e imagem compartilhada.
- [ ] Conferir que arte ilustrativa não é apresentada como foto de fato real.

## Segurança
- [ ] Criar e revogar link de parceiro, confirmando revogação no servidor.
- [ ] Planejar troca do RPC legado por Edge Function em ambiente de teste.
- [ ] Rever avisos RLS / proteção de senhas no dashboard Supabase.
- [ ] Não remover arquivos históricos do GitHub sem referência cruzada.

**Depois de concluir essas verificações em produção, reavaliar o percentual global.**
