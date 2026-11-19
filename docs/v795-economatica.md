# v795 — Economatica: contrato de ingestão e governança

**Não existe credencial/licença configurada no repositório para invocar o MCP corporativo.** A Economatica descreve o serviço como corporativo e condicionado a contrato e OAuth. Por segurança, o PWA não abre MCP, não armazena secrets nem publica dados proprietários no snapshot Cloudflare.

O módulo `economatica-fatos-v795.js` recebe exclusivamente um envelope privado **pré-autorizado pelo gateway** (`provider`, `scope`, ticker, data, unidade, competência e fatos numéricos). Rejeita competência futura, métricas duplicadas, unidades desconhecidas e mais de 80 fatos por chamada. Mesmo aceitos, os fatos têm `scoreEligible:false` até conciliação com demonstrações CVM/SEC; o Worker não envia fatos licenciados ao PDF, UI ou Supabase.

Para habilitar acesso real futuramente é preciso licença e autorização comercial adequada ao uso interno/redistribuição. Não inventar cliente MCP nem OAuth. Referência: https://www.economatica.com/mcp e https://news-api.economatica.com/mcp/pt.
