// Converte observações da imagem em leituras condicionais. As posições são visuais.
const escolas = ['graham','munger','helmer','dalio','markowitz','schwartz','dow'];
export function lentesSolicitadas(texto) {
  const q = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\b(?:teoria de dow|dow jones)\b/g,'');
  const apenasTecnico = /\b(?:so|somente|apenas) (?:o )?(?:livermore|tecnic[oa])\b/.test(q);
  if (apenasTecnico) return [];
  return escolas.filter(id => {
    const nome = id === 'graham' ? '(?:graham|fundamentalista)' : id;
    const pedido = new RegExp('\\b'+nome+'\\b');
    const excluido = new RegExp('\\b(?:sem|exceto|exclua|dispenso|nao (?:quero|inclua|chame))\\s+(?:o |a |tambem )?'+nome+'\\b');
    return pedido.test(q) && !excluido.test(q);
  });
}

export function protocoloLivermore(lentes, quantidade) {
  return `Você é Livermore, técnico do Diário Trader. Faça automaticamente a leitura do gráfico anexado.
  Interprete primeiro o preço: estrutura dominante e perna atual, último topo e fundo relevantes, candle fechado versus pavio ou candle em formação. Um dia forte pode ser só repique. Explique o que mudou, qual extremo segue intacto, cenário, confirmação e invalidação. Inclua Dow, polaridade, Elliott e Fibonacci quando houver âncoras defensáveis. Identifique todos os extremos relevantes do recorte; x,y no pavio da imagem inteira, preço vazio se a escala for ilegível. Não transforme projeção em movimento realizado.
  Reserve afirmações sobre OBV e médias ao registro indicadores_visuais de CADA gráfico. Resumo, cenários e evidências devem funcionar apenas com o preço, com referências espaciais quando a escala não puder ser lida.
  indicadores_visuais = {medias:[{periodo,legenda,inclinacao,posicao,relacao}], obv:{legenda,extremos:[{tipo,anterior:[x,y],recente:[x,y]}],eventos:[{tipo,referencia,preco,obv}]}}. Use arrays vazios ou null para ausente/ilegível. Para cada média trace a curva desde sua legenda legível; transcreva a legenda e o período, inclinação ascendente|descendente|lateral e posição do preço acima|abaixo|sobre. Em relacao descreva ordenação, cruzamento observado, reteste ou afastamento apenas com evidência na curva; não tome linhas desenhadas por médias.
  Identifique OBV pela legenda. Para o trecho recente localize os dois últimos topos e/ou fundos comparáveis NO PAINEL DO OBV. Mesmo tipo, esquerda para direita, coordenadas normalizadas na imagem inteira, y aumenta PARA BAIXO. Não deduza direção do OBV pela direção do preço. Compare também os rompimentos de topo e fundo entre PREÇO e OBV na mesma janela. Para cada evento descreva em referencia os dois extremos correspondentes e a janela; em preco e obv dê o índice da primeira barra fechada que ultrapassou o respectivo extremo, contada desde a mesma origem. Use null quando observou que não rompeu até o final; omita o evento se ordem ou alinhamento forem ilegíveis. Rompimento conjunto confirma a direção, OBV primeiro antecipa uma possibilidade, preço sozinho alerta para possível divergência. Simétrico nos fundos e nos topos.
  Entregue análise técnica em tecnico. Pareceres adicionais autorizados: ${lentes.join(', ') || 'nenhum'}. Somente se solicitados: Graham em fundamentalista usando apenas snapshot autorizado, Munger em critico; demais em especialistas com id e argumento. Não acrescente lentes no resumo, fontes ou cenários. Para ${quantidade} imagens aplique o registro a cada uma, sem misturar indicadores entre imagens.`;
}

const normal = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const ponto = a => Array.isArray(a) && a.length === 2 && a.every(n => Number.isFinite(n) && n >= 0 && n <= 1);
const barra = v => v === null || Number.isInteger(v) && v >= 0;
const tipoValido = t => t === 'topo' || t === 'fundo';

export function indicadoresVisuais(g) {
  const dados = g.indicadores_visuais || {}, medias = [], obv = [];
  for (const m of Array.isArray(dados.medias) ? dados.medias.slice(0,8) : []) {
    if (!Number.isInteger(m?.periodo) || m.periodo <= 0 || m.periodo > 2000) continue;
    const legenda = normal(m.legenda);
    if (!/(?:media|\b(?:ema|sma|mma|mme|mm|ma)(?=\W|\d|$))/.test(legenda) || !new RegExp('(?:^|\\D)'+m.periodo+'(?:\\D|$)').test(legenda)) continue;
    const partes = [String(m.legenda).slice(0,70)];
    if (['ascendente','descendente','lateral'].includes(m.inclinacao)) partes.push(m.inclinacao);
    if (['acima','abaixo','sobre'].includes(m.posicao)) partes.push('preço '+m.posicao+' da curva');
    if (typeof m.relacao === 'string' && m.relacao.trim()) partes.push(m.relacao.trim().slice(0,220));
    medias.push(partes.join(', '));
  }
  const o = dados.obv;
  if (/\b(?:obv|on[ -]balance volume|saldo de volume)\b/.test(normal(o?.legenda))) {
    for (const e of Array.isArray(o.extremos) ? o.extremos.slice(0,4) : []) {
      if (!tipoValido(e?.tipo) || !ponto(e.anterior) || !ponto(e.recente) || e.anterior[0] >= e.recente[0]) continue;
      const dy = e.recente[1]-e.anterior[1];
      obv.push('Últimos dois '+e.tipo+'s do OBV: '+(Math.abs(dy)<.003?'em nível semelhante':dy>0?'descendentes':'ascendentes')+'.');
    }
    for (const e of Array.isArray(o.eventos) ? o.eventos.slice(0,4) : []) {
      if (!tipoValido(e?.tipo) || typeof e.referencia !== 'string' || e.referencia.trim().length < 8 || !barra(e.preco) || !barra(e.obv)) continue;
      const dir = e.tipo === 'fundo' ? 'baixa' : 'alta';
      let leitura;
      if (e.preco === null && e.obv === null) leitura = 'Os dois extremos seguem preservados.';
      else if (e.obv === null) leitura = 'Preço rompeu sem confirmação do OBV. Possível divergência.';
      else if (e.preco === null) leitura = 'OBV rompeu primeiro. Possível antecipação da '+dir+'; falta o rompimento pelo preço.';
      else if (e.preco === e.obv) leitura = 'Rompimento na mesma barra. OBV confirma a '+dir+'.';
      else leitura = e.obv < e.preco ? 'OBV antecipou a '+dir+' e o preço confirmou depois.' : 'Preço rompeu primeiro e o OBV confirmou a '+dir+' depois.';
      obv.push(e.referencia.trim().slice(0,160)+': '+leitura);
    }
    if (!obv.length) obv.push('Painel identificado. Extremos comparáveis ou sequência de rompimento ilegíveis.');
  }
  return {obv:obv.join(' '),medias:medias.join('. '),elastico:'',polaridade:''};
}

// Os parágrafos livres tratam do preço. Indicadores são apresentados a partir do registro acima.
export function somentePreco(texto) {
  if (typeof texto !== 'string') return '';
  return texto.split(/(?<=[.!?])\s+|\n+/).filter(s => !/\b(?:obv|on[ -]balance volume|medias?|(?:mm[ae]?|[se]?ma)\s*\d+|ema|sma|efeito elastico)\b/.test(normal(s))).join(' ').trim();
}
