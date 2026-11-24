#!/usr/bin/env python3
"""Inicia a ponte Profit existente, mudando SOMENTE Nuvem.enviar (cotações básicas).
Coloque este arquivo ao lado da sua ponte_profit.py. Não substitui o arquivo antigo.
Não envia senha, refresh_token, ordens ou dados de conta à Cloudflare.
"""
import datetime, importlib.util, json, pathlib, sys, time, urllib.request, urllib.error
URL = "https://diario-screeners-quant.lucianosilva43567.workers.dev/v1/profit-quotes"
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None
opener = urllib.request.build_opener(NoRedirect())
def edge_send(self, linhas):
    if not linhas:
        return True
    if time.time() > self.exp:
        self.entrar()
    rows = []
    for r in linhas:
        # Não enviar preço sem data/hora real de negócio.
        try:
            d, h = str(r["dat"]).strip(), str(r["hor"]).strip()
            stamp = datetime.datetime.strptime(d + " " + h, "%d/%m/%Y %H:%M:%S" if h.count(":")==2 else "%d/%m/%Y %H:%M")
        except (TypeError, ValueError, KeyError):
            continue
        if not isinstance(r.get("ult"), (int,float)) or r["ult"] <= 0:
            continue
        out = {k:r[k] for k in ("ticker","ult","var","abe","max","min","neg","fec") if k in r and r[k] is not None}
        out.update(dat=stamp.strftime("%d/%m/%Y"),hor=stamp.strftime("%H:%M:%S"))
        rows.append(out)
    if not rows:
        return False
    if len(rows)>250:
        print("Mais de 250 ativos; ajuste a lista da ponte antes de migrar.")
        return False
    body=json.dumps({"sent_at":int(time.time()*1000),"cotacoes":rows},allow_nan=False).encode()
    req=urllib.request.Request(URL,data=body,headers={"Content-Type":"application/json","Authorization":"Bearer "+self.token},method="POST")
    try:
        with opener.open(req,timeout=5) as response:
            result=json.load(response)
            if response.status==200 and result.get("ok") is True:
                if not getattr(self,"_edge_confirmado",False):
                    print("Cloudflare: cotações autenticadas recebidas.")
                    self._edge_confirmado=True
                return True
    except urllib.error.HTTPError as e:
        if e.code==401:self.exp=0
        code=e.code
    except (OSError,ValueError):
        code="conexao"
    else:
        code="resposta invalida"
    if getattr(self,"_edge_erro",None)!=code:
        print("Cloudflare: falha ao enviar cotações:",code,"(sem retorno automático ao Supabase)")
        self._edge_erro=code
    return False
def main():
    if "--simulado" in sys.argv:
        sys.exit("Modo simulado bloqueado para não contaminar a cotação real.")
    path=pathlib.Path(__file__).resolve().with_name("ponte_profit.py")
    if not path.is_file():
        sys.exit("Coloque este arquivo na pasta da ponte existente (ponte_profit.py).")
    spec=importlib.util.spec_from_file_location("ponte_original",path)
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
    if not callable(getattr(getattr(mod,"Nuvem",None),"enviar",None)) or not callable(getattr(mod,"main",None)):
        sys.exit("Versão incompatível da ponte: preserve o original e confira o código.")
    mod.Nuvem.enviar=edge_send
    print("Modo Cloudflare: cotações básicas; operações e opções permanecem na integração anterior.")
    mod.main()
if __name__=="__main__":
    main()
