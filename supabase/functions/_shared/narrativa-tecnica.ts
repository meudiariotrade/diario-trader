/** Reserva editorial determinística: usa os valores já calculados, sem reconstruir indicadores. */
import type { FatosTecnicos } from './consistencia-tecnica.ts';
const n = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const obj = (v: any) => v && typeof v === 'object' ? v : {};
const lista = (v: any): any[] => Array.isArray(v) ? v : [];
const texto = (v: unknown) => typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '';
const fmt = (v: number, casas = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const dia = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v.slice(8) + '/' + v.slice(5, 7) : '';
const valor = (v: unknown) => n(v) ? fmt(v) : 'não informado';
const frase = (s: string) => s ? s.replace(/[.;\s]+$/, '') + '.' : '';
const junta = (p: string[]) => p.filter(Boolean).join(' ');
const limite = (partes: string[], compacto: string[]) => {
  const s = junta(partes); if (s.length <= 1500) return s;
  const curto = junta(compacto); if (curto.length <= 1500) return curto;
  // Não corta uma frase ou condição. A entrada do aplicativo tem tamanho limitado.
  return junta(compacto.filter((_, i) => i < 4));
};
function relacao(t: any, curta = false) {
  if (!t || !n(t.fechamento)) return '';
  const medias = lista(t.medias).filter(m => n(m.valor) && m.posicao !== 'indeterminada');
  const nome = t.tempo === 'diario' ? 'diário' : t.tempo;
  return frase(`No ${nome}, o fechamento ${fmt(t.fechamento)} está ` + (medias.length
    ? medias.map(m => `${m.posicao === 'igual' ? 'sobre' : m.posicao} ${curta ? m.nome : 'a ' + m.nome} (${fmt(m.valor)})`).join('; ')
    : 'sem referência comparável de médias'));
}
function rsi(v: unknown) {
  if (!n(v)) return 'O RSI não foi informado; a leitura de momentum fica limitada.';
  if (v >= 70) return `O RSI14 em ${fmt(v)} indica sobrecompra pelo limiar do método e força compradora, com risco de acomodação; não confirma topo.`;
  if (v <= 30) return `O RSI14 em ${fmt(v)} indica sobrevenda pelo limiar do método e pressão vendedora; não confirma fundo.`;
  if (v < 50) return `O RSI14 em ${fmt(v)} está abaixo da linha central, compatível com momentum enfraquecido, mesmo fora da sobrevenda; isso não equivale a equilíbrio entre as forças.`;
  return `O RSI14 em ${fmt(v)} está na linha central ou acima dela, compatível com sustentação de momentum, sem confirmar sozinho continuidade ou reversão.`;
}
function confluencias(t: any, curta = false) {
  const conf = lista(t.conf).filter(c => n(c.valor) && lista(c.com).length).slice(0, curta ? 1 : 2);
  if (!conf.length) return '';
  return frase('Há proximidade em ' + conf.map(c => `${fmt(c.valor)} com ${lista(c.com).slice(0, 4).join('/')}`).join('; ') + ', formando faixas de observação, não confirmação independente');
}
function polaridade(t: any) {
  const p = t.pol;
  if (!p || !n(p.nivel)) return '';
  const tipo = texto(p.tipo);
  if (/resistência rompida/.test(tipo)) return `Em ${fmt(p.nivel)}, a antiga resistência é potencial suporte; a inversão de função depende de defesa demonstrada.`;
  if (/suporte rompido/.test(tipo)) return `Em ${fmt(p.nivel)}, o antigo suporte é potencial resistência; a inversão de função depende de rejeição demonstrada.`;
  return frase(`${tipo || 'Referência de polaridade'} em ${fmt(p.nivel)} requer observar a reação do preço`);
}
function pivo(f: FatosTecnicos, t: any) {
  const p = t.dow?.pivo, g = f.gatilhos.find(x => x.nome === 'pivô de reversão');
  if (!p || !n(p.v)) return '';
  const fato = g?.condicao_satisfeita === true ? `O fechamento já ultrapassou o pivô ${fmt(p.v)} pelo lado ${g.direcao}`
    : g?.condicao_satisfeita === false ? `O pivô ${fmt(p.v)} ainda depende de fechamento ${g.direcao}` : `O pivô estrutural informado é ${fmt(p.v)}`;
  return frase(fato + (g?.condicao_satisfeita ? '; isso altera a leitura da sequência anterior, mas a reversão completa exige confirmação estrutural adicional' : '; não deve ser confundido com stop de uma operação'));
}
const referencias = (e: any) => lista(e?.fatos?.tecnico?.fibo).filter(q => n(q.v));
export function contemValor(t: string, v: number) {
  const numeros = t.match(/(?<![\p{L}\d_])[-+]?\d{1,3}(?:\.\d{3})+(?:,\d+)?|(?<![\p{L}\d_])[-+]?\d+(?:,\d+)?/gu) || [];
  return numeros.some(s => Math.abs(Number(s.replace(/\./g, '').replace(',', '.')) - v) <= 0.00500001);
}
/** Blocos da revista não podem perder seus fatos centrais ao serem corrigidos pela IA. */
export function cobreMapa(e: any, campo: string, t: string) {
  const d = obj(e?.fatos), m = obj(d.tecnico), k = campo.split('.').at(-1);
  if (!e?.fatos) return true;
  let obrigatorios: unknown[] = [];
  if (k === 'elliott') obrigatorios = [m.perna?.de, m.perna?.ate, ...referencias(e).map(q => q.v), m.elliott?.ext100, m.elliott?.ext1618];
  if (k === 'dow') obrigatorios = [d.fechamento, m.dow?.pivo?.v, d.mm10s, d.mm40s, d.mm20s, d.mm50s, d.mm200s];
  if (k === 'pa') obrigatorios = [d.rsi14];
  if (k === 'cenarios') obrigatorios = [m.refAlta?.[1], m.refBaixa?.[1], m.invalidacao?.v];
  if (!obrigatorios.filter(n).every(v => contemValor(t, v))) return false;
  if (k === 'pa' && lista(m.pa).length && !lista(m.pa).some(p => texto(p.tipo) && t.toLowerCase().includes(texto(p.tipo).toLowerCase()))) return false;
  return true;
}

/** Retém Dow, âncoras, Fibonacci, padrões, RSI e condições específicas do ativo. */
export function reservaTecnica(entrada: any, campo: string, f: FatosTecnicos): string {
  if (f.cobertura === 'snapshot') return 'A cobertura é um snapshot; não permite confirmar tendência semanal, médias ou estrutura histórica. Os limites da amostra exigem conferência de contrato e horário antes de acompanhar um rompimento.';
  const d = obj(entrada?.fatos || entrada), t = obj(d.tecnico), k = campo.split('.').at(-1);
  if (entrada?.fatos) {
    if (k === 'dow') {
      const dow = obj(t.dow), estrutura = frase(`O mapa de Dow classifica a primária como ${texto(dow.primaria) || 'não informada'} e a secundária como ${texto(dow.secundaria) || 'não informada'}`);
      const swings = frase([lista(dow.topos).length ? 'Topos: ' + lista(dow.topos).slice(-2).map(q => valor(q.v)).join(' → ') : '',
        lista(dow.fundos).length ? 'fundos: ' + lista(dow.fundos).slice(-2).map(q => valor(q.v)).join(' → ') : ''].filter(Boolean).join('; '));
      const elastico = n(t.elastico20) ? `O afastamento da MM20 é ${fmt(t.elastico20)}%; esticamento descreve distância, não uma reversão confirmada.` : '';
      const linhas = f.series.map(s => relacao(s));
      return limite([swings ? estrutura.replace(/\.$/,'')+'; '+swings : estrutura, pivo(f,t), linhas.join(' ').replace(/\. No semanal/, '; no semanal'), elastico], [estrutura,pivo(f,t),f.series.map(s=>relacao(s,true)).join(' ').replace(/\. No semanal/, '; no semanal'),elastico]);
    }
    if (k === 'elliott') {
      const p = obj(t.perna), E = obj(t.elliott), alta = p.direcao === 'alta';
      const perna = frase(`A perna dominante de ${texto(p.direcao) || 'direção não informada'} vai de ${valor(p.de)}${dia(p.inicio) ? ' (' + dia(p.inicio) + ')' : ''} a ${valor(p.ate)}${dia(p.fim) ? ' (' + dia(p.fim) + ')' : ''}`);
      const hipotese = n(E.profundidade) ? `A reação posterior alcançou ${fmt(E.profundidade)}% da perna; ${texto(E.fase) ? 'o mapa sugere '+texto(E.fase)+', hipótese preliminar' : 'a hipótese de ciclo é preliminar'}, pois o percentual não confirma sozinho ondas específicas.` : 'A hipótese de Elliott depende da sequência de pivôs e das regras de invalidação, além da retração.';
      const fibo = referencias(entrada).length ? frase('As retrações fornecidas são ' + referencias(entrada).map(q => `${fmt(q.f * 100, 1)}% em ${fmt(q.v)}`).join('; ')) : 'As retrações não foram fornecidas para este bloco.';
      const ext = n(E.ext100) && n(E.ext1618) ? `As extensões de 100% em ${fmt(E.ext100)} e de 161,8% em ${fmt(E.ext1618)} são projeções condicionais ${n(E.gatilho) ? 'à ' + (alta ? 'superação' : 'perda') + ' de ' + fmt(E.gatilho) : 'do método'}, sem alcance assegurado.` : '';
      const invalidacao = n(E.invalida) ? `A referência de invalidação da perna é ${fmt(E.invalida)}.` : '';
      return limite([perna,hipotese,confluencias(t)?fibo.replace(/\.$/,'')+'; '+confluencias(t):fibo, invalidacao&&ext?ext.replace(/\.$/,'')+'; '+invalidacao:ext||invalidacao,polaridade(t)], [perna,hipotese,fibo,ext.replace(/\.$/,'')+'; '+invalidacao,confluencias(t,true)]);
    }
    if (k === 'pa') {
      const grupos = new Map<string, string[]>();
      for (const p of lista(t.pa)) { const tipo=texto(p.tipo); if(!tipo)continue; const dias=grupos.get(tipo)||[]; if(dia(p.dia))dias.push(dia(p.dia)); grupos.set(tipo,dias); }
      const padroes = grupos.size ? frase('Nos candles recentes aparecem ' + [...grupos].slice(0,3).map(([tipo,dias])=>tipo+(dias.length?' ('+[...new Set(dias)].join(', ')+')':'')).join('; ')) : 'Não há padrão de candle detalhado suficiente para confirmar uma mudança de direção.';
      const seq = texto(t.seq) ? frase('A sequência recente é ' + texto(t.seq) + '; esse horizonte não substitui a tendência maior') : '';
      return limite([padroes,seq,rsi(d.rsi14),'Pavios registram rejeição intrabar; inside bar contém a amplitude da barra anterior, sem provar reversão, compressão persistente ou expansão futura.'],[padroes,seq,rsi(d.rsi14)]);
    }
    if (k === 'cenarios') {
      const alta=t.perna?.direcao==='alta', E=obj(t.elliott), cont=alta?t.refAlta:t.refBaixa, pb=alta?t.refBaixa:t.refAlta;
      const gatilho=n(cont?.[1])?cont[1]:E.gatilho, sentido=alta?'acima':'abaixo';
      const principal=n(gatilho)?`Um fechamento diário ${sentido} de ${fmt(gatilho)} favoreceria a continuidade, ${n(E.gatilho)&&E.gatilho!==gatilho?'com referência intermediária em '+fmt(E.gatilho):'sujeita à reação do preço no nível'}; não assegura o percurso.`:'A continuidade exige confirmação por fechamento nos níveis fornecidos pelo mapa.';
      const ext=n(E.ext100)&&n(E.ext1618)?`As extensões ${fmt(E.ext100)} e ${fmt(E.ext1618)} são referências posteriores condicionais, sem substituir os níveis intermediários.`:'';
      const alternativa=n(pb?.[1])?`No cenário alternativo, ${alta?'recuo':'repique'} até ${fmt(pb[1])} exige observar ${alta?'defesa compradora':'rejeição vendedora'} antes de concluir pela retomada.`:'';
      const inval=n(t.invalidacao?.v)?`A invalidação estrutural está em fechamento ${alta?'abaixo':'acima'} de ${fmt(t.invalidacao.v)}; melhora de curto prazo é outra condição, e esse nível não é stop automático.`:'A invalidação estrutural exige referência identificável no mapa, distinta do stop de uma operação.';
      return limite([principal,ext,alternativa,inval],[principal,ext,alternativa,inval]);
    }
  }
  // Aba Análises: também preserva seus horizontes, planos e estatísticas, sem criar números.
  const tempo = /mensal|semanal|diario/.exec(campo)?.[0];
  if (k === 'estatistica') {
    const q=obj(d.estudo_quantitativo);return frase('A interpretação estatística requer comparar os estudos e a taxa-base fornecidos, respeitando a amostra e o regime do ativo')+' '+
      (Object.keys(q).length?'O estudo quantitativo calculado continua disponível nos dados; não há inferência adicional validada para este trecho.':'Não foi fornecido estudo quantitativo suficiente para atribuir probabilidade ou vantagem.');
  }
  if (k === 'indicadores' || k === 'forca_e_volume') return junta([rsi(f.rsi14),frase('Volume e OBV devem confirmar o preço apenas quando houver dados do horizonte; candles mistos não apagam a direção da estrutura maior')]);
  const estrutura = tempo ? d.leitura_dow_do_trader?.[tempo] : d.leitura_dow_do_trader?.diario;
  const dow = estrutura?.tendencia ? frase(`Pelos pivôs do método, a estrutura ${tempo||'diária'} está em ${texto(estrutura.tendencia)}`) : '';
  const medias = f.series.filter(s => !tempo || s.tempo===tempo).map(s=>relacao(s));
  const pivos = f.gatilhos.filter(g=>!tempo||g.tempo===tempo).map(g=>frase(`O pivô de ${g.tempo} em ${fmt(g.nivel)} ${g.condicao_satisfeita===true?'já foi ultrapassado pelo fechamento atual':g.condicao_satisfeita===false?'ainda depende de fechamento '+g.direcao:'não tem confirmação determinada'}; isso não dispensa avaliar a sequência de topos e fundos`));
  return limite([dow,...medias,...pivos,'A invalidação estrutural é distinta do stop da operação; o mapa e os planos calculados mantêm suas referências.'],[dow,...medias,...pivos]);
}
