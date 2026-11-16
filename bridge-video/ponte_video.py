# -*- coding: utf-8 -*-
"""
PONTE DE VÍDEO — Diário de Trader
Transforma uma videoaula do app em um arquivo MP4 com voz neural e legenda palavra por palavra,
pronto para assistir, mandar no WhatsApp ou postar (16:9 ou 9:16).

Como funciona (tudo no seu computador):
  1. entra na sua conta do app (o mesmo e-mail e senha) e lista as aulas prontas;
  2. gera a narração com uma voz neural gratuita da Microsoft em português (edge-tts),
     que também informa o tempo exato de cada palavra;
  3. abre o próprio app num navegador invisível e fotografa cada cena, palavra por palavra;
  4. o FFmpeg junta as imagens e a voz em um MP4.

Uso: dê dois cliques em "GERAR VIDEO.bat" (ou rode: python ponte_video.py).
"""
import asyncio, base64, getpass, json, os, re, shutil, subprocess, sys, tempfile, time, wave
from pathlib import Path
from urllib import request as urlreq, error as urlerr

PASTA = Path(__file__).resolve().parent
CONFIG = PASTA / "config.json"
SUPA_URL = "https://wbpsmszecpzioaijfnsl.supabase.co"
SUPA_KEY = "sb_publishable_GNuBD5Oyo2Wk-iE2s4TbUQ_1XiKvzhV"   # chave pública do app (a mesma do site)
APP_URL_PADRAO = "https://meudiariotrade.github.io/diario-trader/"
VOZES = {"1": ("pt-BR-AntonioNeural", "Antônio (masculina)"), "2": ("pt-BR-FranciscaNeural", "Francisca (feminina)"),
         "3": ("pt-BR-ThalitaMultilingualNeural", "Thalita (feminina, mais natural)")}
FORMATOS = {"1": ("16x9", 1920, 1080, "ajustar"), "2": ("9x16", 1080, 1920, "ajustar"), "3": ("1x1", 1080, 1080, "ajustar")}
PAUSA_FRASE, PAUSA_PERGUNTA, PAUSA_CENA = 0.18, 0.9, 0.9
TAXA = 24000

# ---------------------------------------------------------------- utilidades
def diga(*a): print(*a, flush=True)
def le_cfg():
    try: return json.loads(CONFIG.read_text(encoding="utf-8"))
    except Exception: return {}
def grava_cfg(c): CONFIG.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")
def pergunta(txt, padrao=""):
    r = input(f"{txt}{f' [{padrao}]' if padrao else ''}: ").strip()
    return r or padrao
def ffmpeg_bin():
    f = shutil.which("ffmpeg")
    if f: return f
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        sys.exit("Não encontrei o FFmpeg. Rode o INSTALAR.bat de novo.")
def http(metodo, url, corpo=None, token=None, extra=None):
    h = {"apikey": SUPA_KEY, "Content-Type": "application/json"}
    if token: h["Authorization"] = "Bearer " + token
    if extra: h.update(extra)
    dados = json.dumps(corpo).encode() if corpo is not None else None
    req = urlreq.Request(url, data=dados, headers=h, method=metodo)
    try:
        with urlreq.urlopen(req, timeout=40) as r: return json.loads(r.read().decode() or "null")
    except urlerr.HTTPError as e:
        msg = e.read().decode(errors="ignore")[:300]
        raise RuntimeError(f"{e.code}: {msg}")

# ---------------------------------------------------------------- conta e aulas
def entrar(cfg):
    if cfg.get("rt"):
        try:
            s = http("POST", SUPA_URL + "/auth/v1/token?grant_type=refresh_token", {"refresh_token": cfg["rt"]})
            cfg["rt"] = s["refresh_token"]; grava_cfg(cfg); return s
        except Exception:
            diga("A sessão salva expirou. Entre de novo.")
    email = pergunta("E-mail da sua conta do app", cfg.get("email", ""))
    senha = getpass.getpass("Senha (não aparece enquanto digita): ")
    s = http("POST", SUPA_URL + "/auth/v1/token?grant_type=password", {"email": email, "password": senha})
    cfg["email"] = email; cfg["rt"] = s["refresh_token"]; grava_cfg(cfg)
    return s

def aulas_prontas(sess):
    uid = sess["user"]["id"]
    return http("GET", f"{SUPA_URL}/rest/v1/aulas?select=id,livro,numero,titulo,status,criado_em,min:roteiro->min&user_id=eq.{uid}&status=eq.pronta&order=livro.asc,numero.asc", token=sess["access_token"]) or []

def roteiro_de(sess, aid):
    r = http("GET", f"{SUPA_URL}/rest/v1/aulas?select=roteiro&id=eq.{aid}", token=sess["access_token"])
    return r[0]["roteiro"]

def envia_video(sess, aid, nome_fmt, arquivo):
    """Manda o MP4 para a sua conta (pasta só sua); o app mostra o botão 🎬 Vídeo na aula."""
    ff = ffmpeg_bin(); arq = Path(arquivo)
    if arq.stat().st_size > 48 * 1024 * 1024:   # limite do armazenamento: 50 MB por arquivo
        menor = arq.with_name(arq.stem + " (app).mp4")
        subprocess.run([ff, "-y", "-loglevel", "error", "-i", str(arq), "-vf", "scale='min(1280,iw)':-2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "27",
                        "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", str(menor)], check=True)
        arq = menor
        if arq.stat().st_size > 48 * 1024 * 1024:
            diga("  (vídeo grande demais para enviar ao app; ficou só no computador)"); return False
    caminho = f"{sess['user']['id']}/{aid}-{nome_fmt}.mp4"
    req = urlreq.Request(f"{SUPA_URL}/storage/v1/object/aulas-videos/{caminho}", data=arq.read_bytes(), method="POST",
                         headers={"apikey": SUPA_KEY, "Authorization": "Bearer " + sess["access_token"], "Content-Type": "video/mp4", "x-upsert": "true"})
    try:
        with urlreq.urlopen(req, timeout=600) as resp: resp.read()
        return True
    except urlerr.HTTPError as e:
        diga(f"  (não consegui enviar ao app: {e.code} {e.read().decode(errors='ignore')[:160]})"); return False

def escolhe_aula(sess):
    L = aulas_prontas(sess)
    if not L: sys.exit("Você ainda não tem aulas prontas no app. Gere uma em Estudos → Aulas.")
    diga("\nAulas prontas:")
    for i, a in enumerate(L, 1):
        diga(f"  {i:>2}. {a['livro']} — Aula {a['numero']}: {a['titulo']}  (~{a.get('min') or '?'} min)")
    n = int(pergunta("Número da aula", "1"))
    a = L[max(1, min(n, len(L))) - 1]
    a["roteiro"] = roteiro_de(sess, a["id"])
    return a

# ---------------------------------------------------------------- voz (edge-tts) com tempo de cada palavra
async def tts(texto, voz, taxa, destino_mp3):
    from tecnica_video import normalizar_texto_para_voz
    texto=normalizar_texto_para_voz(texto)
    import edge_tts
    try: com = edge_tts.Communicate(texto, voz, rate=taxa, boundary="WordBoundary")
    except TypeError: com = edge_tts.Communicate(texto, voz, rate=taxa)
    palavras = []
    with open(destino_mp3, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio": f.write(ch["data"])
            elif ch["type"] == "WordBoundary": palavras.append(ch["offset"] / 1e7)
    return palavras

def para_wav(ff, mp3, wav):
    subprocess.run([ff, "-y", "-loglevel", "error", "-i", str(mp3), "-ar", str(TAXA), "-ac", "1", "-sample_fmt", "s16", str(wav)], check=True)
    with wave.open(str(wav), "rb") as w: return w.getnframes() / w.getframerate()

def silencio(seg):
    return b"\x00\x00" * int(seg * TAXA)

# ---------------------------------------------------------------- captura no navegador
JS_PREP = r"""
([aula, formato]) => {
  window.AULAS_LOCAIS = [aula];
  try { localStorage.setItem('diario-v433-formato', formato); localStorage.setItem('aulas-mudo', '1'); } catch (e) {}
}
"""
CSS_GRAVA = """
#aup .aup-top,#aup .aup-ctl,#aup .aup-prog,#au353-voice-alert,#aup .aup-idx,#aupoptions,.au361-mini-bar{display:none!important}
#onb,.toast,#toast,[class*=toast]{display:none!important}
#aup{padding:0!important}
#aup .aup-stage{padding:7vmin 5vmin 1vmin!important}
#aup .aup-vis{margin:auto!important}
#aup .aup-cap{display:none!important}
*,*::before,*::after{transition:none!important;animation:none!important}
#v434-leg{flex:none;min-height:3.1em;padding:1.2vmin 6vmin 5vmin;font:700 max(17px,4.2vmin)/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center;color:#94a3b8}
#v434-leg b{font-weight:700;color:#94a3b8}#v434-leg b.dito{color:#f8fafc}#v434-leg b.agora{color:#facc15}
#v434-marca{position:fixed;top:2.2vmin;left:3vmin;z-index:20000;font:700 max(14px,1.6vmin) system-ui,sans-serif;color:#7dd3fc;opacity:.85;letter-spacing:.02em}
#v434-cena{position:fixed;top:2.2vmin;right:3vmin;z-index:20000;font:600 max(13px,1.5vmin) system-ui,sans-serif;color:#94a3b8}
"""

async def gravar(aula, sess, cfg, voz, taxa_voz, formato, saida, sem_voz=False):
    if aula.get('roteiro',{}).get('mentor'):
        import tecnica_video, ponte_video
        return await tecnica_video.gravar(ponte_video,tecnica_video.manifesto_pdf(aula),cfg,voz,taxa_voz,formato,saida,sem_voz=sem_voz)
    from playwright.async_api import async_playwright
    ff = ffmpeg_bin()
    tmp = Path(tempfile.mkdtemp(prefix="aula_"))
    nome_fmt, W, H, fmt_app = formato
    app_url = cfg.get("app_url", APP_URL_PADRAO)
    sessao_app = {"at": sess["access_token"], "rt": sess["refresh_token"], "exp": int(time.time() * 1000) + int(sess.get("expires_in", 3600)) * 1000,
                  "uid": sess["user"]["id"], "email": sess["user"].get("email", "")}
    aula_local = {"id": "ponte-" + aula["id"], "local": 1, "livro": aula["livro"], "numero": aula["numero"], "titulo": aula["titulo"],
                  "status": "pronta", "criado_em": "ponte", "roteiro": aula["roteiro"]}
    frames, audio = [], bytearray()   # frames: (arquivo, duração)
    async with async_playwright() as pw:
        nav = await pw.chromium.launch()
        esc_ = 2 if H > W else 1.5   # em pé: tela de celular; deitado/quadrado: 1280×720 (evita o layout de celular deitado)
        ctx = await nav.new_context(viewport={"width": int(W / esc_), "height": int(H / esc_)}, device_scale_factor=esc_, reduced_motion="reduce")
        await ctx.add_init_script(f"try{{localStorage.setItem('diario-sess',{json.dumps(json.dumps(sessao_app))})}}catch(e){{}}")
        pg = await ctx.new_page()
        await pg.add_init_script(script=f"({JS_PREP})({json.dumps([aula_local, fmt_app])})")
        diga("Abrindo o app…")
        await pg.goto(app_url, wait_until="domcontentloaded", timeout=90000)
        await pg.wait_for_function("window.AULAS && window.AULAS.abre", timeout=90000)
        await pg.wait_for_timeout(2500)
        await pg.evaluate("id=>{document.getElementById('onb')?.remove();window.AULAS.abre(id)}", aula_local["id"])
        await pg.wait_for_selector("#aupvis", timeout=30000)
        await pg.add_style_tag(content=CSS_GRAVA)
        await pg.evaluate("t=>{const m=document.createElement('div');m.id='v434-marca';m.textContent=t;document.body.appendChild(m);const c=document.createElement('div');c.id='v434-cena';document.body.appendChild(c);const l=document.createElement('div');l.id='v434-leg';document.getElementById('aupcap').after(l)}",
                          f"Diário de Trader · Aula {aula['numero']} · {aula['titulo']}")
        cenas = aula["roteiro"]["cenas"]; n = 0; total = len(cenas)
        for i, c in enumerate(cenas):
            await pg.evaluate("i=>window.AULAS._dbg.cena(i,0)", i)
            # cenas com dados reais: espera o gráfico (até 20 s)
            L = None
            for _ in range(40):
                L = await pg.evaluate("i=>{const d=window.AULAS._dbg;return d.falasCena(d.P.a.r.cenas[i])}", i)
                if L is not None: break
                await pg.wait_for_timeout(500)
            L = L or [{"t": p, "k": k} for k, p in enumerate(c.get("falaSem") or c.get("fala") or [])]
            await pg.evaluate("t=>{document.getElementById('v434-cena').textContent=t}", f"{i + 1}/{total} · {c.get('titulo', '')}")
            diga(f"  cena {i + 1}/{total}: {c.get('titulo', '')}  ({len(L)} frases)")
            for j, f in enumerate(L):
                texto = f["t"]; k = f["k"]
                # visual do parágrafo k + legenda da frase
                await pg.evaluate("""([i,k,t])=>{const d=window.AULAS._dbg,P=d.P,c=P.a.r.cenas[i],v=c.vis||{tipo:'titulo',t:c.titulo},el=document.getElementById('aupvis');
                    const R=window.AULAS.VIS[v.tipo]||window.AULAS.VIS.titulo;el.innerHTML=R(v,k,P.dados[i],c);el.className='aup-vis au-'+v.tipo;
                    const leg=document.getElementById('v434-leg');leg.innerHTML=t.split(/(\\s+)/).map(p=>/\\s/.test(p)||!p?p:'<b>'+p.replace(/[&<>]/g,'')+'</b>').join('');}""", [i, k, texto])
                await pg.wait_for_timeout(120)
                # voz
                mp3, wav = tmp / f"f{n}.mp3", tmp / f"f{n}.wav"
                if sem_voz:
                    dur = max(1.2, len(texto) / 14.5); toks = texto.split(); tempos = [dur * q / max(1, len(toks)) for q in range(len(toks))]
                    audio += silencio(dur)
                else:
                    for tentativa in range(4):
                        try: tempos = await tts(texto, voz, taxa_voz, mp3); break
                        except Exception as e:
                            if tentativa == 3: raise RuntimeError("A voz neural não respondeu (confira a internet): " + str(e))
                            if tentativa == 1 and voz != "pt-BR-FranciscaNeural":
                                diga("  (essa voz não respondeu; usando a Francisca)"); voz = "pt-BR-FranciscaNeural"
                            await asyncio.sleep(2)
                    dur = para_wav(ff, mp3, wav)
                    with wave.open(str(wav), "rb") as w: audio += w.readframes(w.getnframes())
                # legenda palavra por palavra: uma imagem para cada palavra
                spans = await pg.evaluate("()=>document.querySelectorAll('#v434-leg b').length")
                if len(tempos) != spans:   # a voz contou palavras de outro jeito: distribui proporcionalmente
                    tempos = [dur * q / max(1, spans) for q in range(spans)]
                marcas = tempos + [dur]
                for q in range(max(1, spans)):
                    await pg.evaluate("q=>document.querySelectorAll('#v434-leg b').forEach((s,x)=>{s.classList.toggle('dito',x<q);s.classList.toggle('agora',x===q)})", q)
                    img = tmp / f"img{len(frames):06d}.jpg"
                    await pg.screenshot(path=str(img), type="jpeg", quality=88)
                    frames.append((img, max(0.04, marcas[q + 1] - marcas[q]) if spans else dur))
                pausa = PAUSA_PERGUNTA if texto.endswith("?") else PAUSA_FRASE
                if j == len(L) - 1: pausa = (c.get("pausa", 900) or 900) / 1000 if i < total - 1 else 1.5
                await pg.evaluate("()=>document.querySelectorAll('#v434-leg b').forEach(s=>{s.classList.add('dito');s.classList.remove('agora')})")
                img = tmp / f"img{len(frames):06d}.jpg"; await pg.screenshot(path=str(img), type="jpeg", quality=88)
                frames.append((img, pausa)); audio += silencio(pausa); n += 1
        await nav.close()
    # junta tudo
    diga("Montando o vídeo (FFmpeg)…")
    wavf = tmp / "voz.wav"
    with wave.open(str(wavf), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(TAXA); w.writeframes(bytes(audio))
    lista = tmp / "frames.txt"
    with open(lista, "w", encoding="utf-8") as f:
        for img, d in frames: f.write(f"file '{img.as_posix()}'\nduration {d:.3f}\n")
        f.write(f"file '{frames[-1][0].as_posix()}'\n")
    saida.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([ff, "-y", "-loglevel", "error", "-stats", "-f", "concat", "-safe", "0", "-i", str(lista), "-i", str(wavf),
                    "-vf", f"fps=30,scale={W}:{H}:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
                    "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", str(saida)], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    return sum(d for _, d in frames)

# ---------------------------------------------------------------- principal
def nome_arquivo(aula, fmt):
    limpa = re.sub(r'[<>:"/\\|?*]+', "", f"{aula['livro']} - Aula {aula['numero']} - {aula['titulo']}")[:120]
    return f"{limpa} ({fmt[0]}).mp4"
def pasta_saida(cfg): return Path(cfg.get("pasta_saida") or (Path.home() / "Videos" / "Diario de Trader"))

def pergunta_voz(cfg):
    diga("\nVoz:"); [diga(f"  {k}. {v[1]}") for k, v in VOZES.items()]
    k = pergunta("Escolha a voz", cfg.get("voz", "1")); k = k if k in VOZES else "1"; cfg["voz"] = k
    vel = pergunta("Velocidade da fala (0 = normal, 10 = 10% mais rápida, -10 = mais lenta)", cfg.get("vel", "0"))
    try: int(vel)
    except ValueError: vel = "0"
    cfg["vel"] = vel
    return VOZES[k][0], f"{int(vel):+d}%"

def gerar_um(cfg, sess):
    aula = escolhe_aula(sess)
    voz, taxa = pergunta_voz(cfg)
    diga("\nFormato:\n  1. 16:9 deitado (YouTube, TV, computador)\n  2. 9:16 em pé (Stories, Reels, TikTok, WhatsApp)\n  3. 1:1 quadrado (feed)")
    k = pergunta("Escolha o formato", cfg.get("fmt", "1")); k = k if k in FORMATOS else "1"; cfg["fmt"] = k; fmt = FORMATOS[k]
    grava_cfg(cfg)
    destino = pasta_saida(cfg) / nome_arquivo(aula, fmt)
    diga(f"\nGerando: {destino.name}\nIsso leva alguns minutos (cerca de 1 minuto para cada 2 de vídeo). Não feche esta janela.\n")
    t0 = time.time(); dur = asyncio.run(gravar(aula, sess, cfg, voz, taxa, fmt, destino))
    diga(f"\nPronto! Vídeo de {int(dur // 60)} min {int(dur % 60)} s em {int(time.time() - t0)} s.\nArquivo: {destino}")
    if pergunta("Enviar este vídeo para o app (aparece o botão 🎬 Vídeo na aula)? s/n", "s").lower().startswith("s"):
        sess = entrar(cfg)
        if envia_video(sess, aula["id"], fmt[0], destino): diga("Enviado. Abra Estudos → Aulas no celular.")
    if os.name == "nt":
        try: os.startfile(destino.parent)
        except Exception: pass

def configura_auto(cfg):
    diga("\nMODO AUTOMÁTICO: com o computador ligado, a ponte confere a cada 10 minutos se há aula nova pronta,\n"
         "gera o vídeo e manda para o app. Escolha uma vez como os vídeos devem sair:")
    voz, taxa = pergunta_voz(cfg)
    diga("\nFormatos (pode escolher mais de um, ex.: 2,1):\n  1. 16:9 deitado\n  2. 9:16 em pé\n  3. 1:1 quadrado")
    ks = [x.strip() for x in pergunta("Formatos", ",".join(cfg.get("auto", {}).get("fmts", ["2"]))).split(",") if x.strip() in FORMATOS] or ["2"]
    antigas = pergunta("Converter também as aulas que você já tem? s/n", "n").lower().startswith("s")
    cfg["auto"] = {"voz": voz, "taxa": taxa, "fmts": ks, "antigas": antigas, "desde": cfg.get("auto", {}).get("desde") or time.strftime("%Y-%m-%dT%H:%M:%S")}
    cfg.setdefault("feitos", {}); grava_cfg(cfg)
    diga("Modo automático configurado.")

def vigiar(cfg):
    a = cfg.get("auto")
    if not a: sys.exit("Rode LIGAR AUTOMATICO.bat primeiro para escolher voz e formatos.")
    diga(f"Modo automático ligado ({time.strftime('%d/%m %H:%M')}). Pode minimizar esta janela.")
    while True:
        try:
            sess = entrar(cfg)
            for aula in aulas_prontas(sess):
                chave = aula["id"] + "|" + str(aula.get("criado_em") or "")
                if cfg.setdefault("feitos", {}).get(chave): continue
                if not a.get("antigas") and str(aula.get("criado_em") or "") < a["desde"]:
                    cfg["feitos"][chave] = "antiga"; grava_cfg(cfg); continue
                aula["roteiro"] = roteiro_de(sess, aula["id"])
                for k in a["fmts"]:
                    fmt = FORMATOS[k]; destino = pasta_saida(cfg) / nome_arquivo(aula, fmt)
                    diga(f"[{time.strftime('%H:%M')}] Aula nova: {destino.name}")
                    asyncio.run(gravar(aula, sess, cfg, a["voz"], a["taxa"], fmt, destino))
                    sess = entrar(cfg)
                    ok = envia_video(sess, aula["id"], fmt[0], destino)
                    diga(f"[{time.strftime('%H:%M')}] {'Pronto e enviado ao app' if ok else 'Pronto (só no computador)'}: {destino.name}")
                cfg["feitos"][chave] = time.strftime("%Y-%m-%d %H:%M"); grava_cfg(cfg)
            import tecnica_video, ponte_video
            tecnica_video.processar(ponte_video, cfg)
        except KeyboardInterrupt: raise
        except Exception as e:
            diga(f"[{time.strftime('%H:%M')}] Aviso: {e}  (tento de novo em 10 minutos)")
        time.sleep(600)

def main():
    diga("=" * 60 + "\n  PONTE DE VÍDEO — Diário de Trader\n" + "=" * 60)
    cfg = le_cfg()
    if "--app" in sys.argv: cfg["app_url"] = sys.argv[sys.argv.index("--app") + 1]; grava_cfg(cfg)
    if "--teste" in sys.argv:   # ensaio local sem conta e sem voz (só para conferir a montagem)
        aula = json.loads(Path(sys.argv[sys.argv.index("--teste") + 1]).read_text(encoding="utf-8"))
        sess = {"access_token": "x", "refresh_token": "x", "user": {"id": "teste", "email": ""}}
        fmt = FORMATOS[os.environ.get("FMT", "1")]; destino = pasta_saida(cfg) / nome_arquivo(aula, fmt)
        t0 = time.time(); dur = asyncio.run(gravar(aula, sess, cfg, VOZES["1"][0], "+0%", fmt, destino, sem_voz=True))
        diga(f"\nPronto! Vídeo de {int(dur // 60)} min {int(dur % 60)} s em {int(time.time() - t0)} s.\nArquivo: {destino}"); return
    if not cfg.get("app_url"):
        cfg["app_url"] = pergunta("Endereço do seu app (o que você abre no celular)", APP_URL_PADRAO); grava_cfg(cfg)
    if "--trilha" in sys.argv:
        import tecnica_video, ponte_video
        tecnica_video.processar(ponte_video, cfg, manual=True); return
    if "--vigiar" in sys.argv: vigiar(cfg); return
    sess = entrar(cfg)
    if "--config-auto" in sys.argv: configura_auto(cfg); return
    gerar_um(cfg, sess)

if __name__ == "__main__":
    try: main()
    except KeyboardInterrupt: diga("\nCancelado.")
    except Exception as e:
        diga("\nERRO: " + str(e)); diga("Se não souber resolver, tire um print desta janela e mande no chat.")
    if os.name == "nt" and "--vigiar" not in sys.argv: input("\nAperte Enter para fechar…")
