/* Motor aritmético da carteira. Não consulta preços nem produz apuração fiscal. */
(function(root){
 'use strict';
 function num(v){
  if(typeof v==='number')return Number.isFinite(v)?v:null;
  if(typeof v!=='string'||!v.trim())return null;
  let s=v.trim();if(s.includes(',')){if(!/^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+),\d+$/.test(s))return null;s=s.replace(/\./g,'').replace(',','.')}
  else if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))return null;
  return Number.isFinite(Number(s))?Number(s):null;
 }
 const value=v=>num(v)??0;
    function apply(J, at, _, classify = () => ({cl:"outro"})) {
      const rt = (at.mk || "BR") + ":" + at.tk,
        tt = at.mk === "US" ? value(at.fx) || _ || 0 : 1,
        L = value(at.q),
        V = value(at.p),
        nt = value(at.cs);
      if (at.tp === "A" || at.tp === "R")
        return { fluxo: 0, prov: 0, caixa: (at.tp === "A" ? 1 : -1) * V * tt };
      const et =
        J[rt] ??
        (J[rt] = {
          k: rt,
          mk: at.mk || "BR",
          tk: at.tk,
          cl: at.cl || classify(at.tk).cl,
          q: 0,
          c: 0,
          prov: 0,
          real: 0,
          first: null,
          cR: 0,
        });
      if ((at.cl && (et.cl = at.cl), at.tp === "P")) {
        const ht = (L ? V * L : V) - nt;
        return ((et.prov += ht), { fluxo: 0, prov: ht * tt, caixa: ht * tt, k: rt });
      }
      if (at.tp === "E") {
        const ht = value(at.f);
        if (at.ev === "desd" && ht > 0) et.q *= ht;
        else if (at.ev === "grup" && ht > 0) et.q /= ht;
        else if (at.ev === "bonif" && ht > 0) {
          const dt = (et.q * ht) / 100;
          ((et.q += dt), (et.c += dt * value(at.p)), (et.cR += dt * value(at.p) * tt));
        }
        return { fluxo: 0, prov: 0, caixa: 0, k: rt };
      }
      if (at.tp === "C")
        return (
          (et.q += L),
          (et.c += L * V + nt),
          (et.cR += (L * V + nt) * tt),
          et.first || (et.first = at.d),
          { fluxo: (L * V + nt) * tt, prov: 0, caixa: -(L * V + nt) * tt, k: rt }
        );
      if (at.tp === "V") {
        const ht = et.q > 0 ? et.c / et.q : 0,
          dt = et.q > 0 ? et.cR / et.q : 0,
          pt = Math.min(L, et.q);
        return (
          (et.real += pt * V - nt - ht * pt),
          (et.c -= ht * pt),
          (et.cR -= dt * pt),
          (et.q -= pt),
          et.q < 1e-9 && ((et.q = 0), (et.c = 0), (et.cR = 0), (et.first = null)),
          { fluxo: -(pt * V - nt) * tt, prov: 0, caixa: (pt * V - nt) * tt, k: rt }
        );
      }
      return { fluxo: 0, prov: 0, caixa: 0 };
    }

 function audit(rows=[],until='9999-12-31'){
  const state={},issues=[],ids=new Set();let cashBRL=0,cashUSD=0;
  const add=(row,code,message)=>issues.push({id:row.id||'',ticker:row.tk||'',date:row.d||'',index:rows.indexOf(row),code,message});
  for(const row of rows.slice().sort((a,b)=>String(a.d||'').localeCompare(String(b.d||''))||(a.tp==='E')-(b.tp==='E'))){
   if(row.d>until)continue;
   if(!/^\d{4}-\d{2}-\d{2}$/.test(row.d||'')||Number.isNaN(Date.parse(row.d+'T12:00:00Z'))||new Date(row.d+'T12:00:00Z').toISOString().slice(0,10)!==row.d){add(row,'date','Data inválida.');continue}
   if(row.id&&ids.has(row.id)){add(row,'duplicate','Identificador repetido.');continue}if(row.id)ids.add(row.id);
   if(!['C','V','P','E','A','R'].includes(row.tp)){add(row,'type','Tipo de lançamento não reconhecido.');continue}
   const q=num(row.q),price=num(row.p),fee=num(row.cs??0),fx=num(row.fx),key=(row.mk||'BR')+':'+row.tk;
   if(fee==null||fee<0){add(row,'fee','Custo inválido ou negativo.');continue}
   if(row.tp!=='E'&&(price==null||price<0||row.tp==='C'&&price===0)){add(row,'price','Preço ou valor inválido.');continue}
   if(['C','V'].includes(row.tp)&&!(q>0)){add(row,'quantity','Quantidade deve ser positiva.');continue}
   if(row.tp==='P'&&row.q!=null&&row.q!==''&&(q==null||q<0)){add(row,'quantity','Quantidade de proventos inválida.');continue}
   if(row.tp==='V'&&q>(state[key]?.q||0)+1e-8){add(row,'oversell','Venda superior à quantidade registrada; confira o histórico.');continue}
   if(row.tp==='E'&&(!['desd','grup','bonif'].includes(row.ev)||!(num(row.f)>0))){add(row,'event','Evento corporativo ou fator inválido.');continue}
   if(row.tp==='E'&&row.ev==='bonif'&&(price==null||price<0)){add(row,'price','Preço atribuído à bonificação inválido.');continue}
   if(row.mk==='US'&&!(fx>0))add(row,'fx','Câmbio histórico não informado; custo e fluxo em BRL não estão comprovados.');
   const flow=apply(state,row,0);
   if(row.mk==='US'){
    // O fluxo nativo da venda depende da posição anterior, já validada acima.
    cashUSD+=row.tp==='V'?q*price-fee:row.tp==='C'?-(q*price+fee):row.tp==='P'?(q?q*price:price)-fee:row.tp==='A'?price:row.tp==='R'?-price:0;
   }else cashBRL+=flow.caixa;
  }
  return {positions:Object.values(state).map(p=>({...p,pm:p.q>1e-9?p.c/p.q:null,unit:p.mk==='US'?'USD':'BRL'})),issues,cash:{BRL:cashBRL,USD:cashUSD},complete:issues.length===0};
 }
 root.CarteiraCalculo=Object.freeze({num,apply,audit});
})(typeof window==='undefined'?globalThis:window);
