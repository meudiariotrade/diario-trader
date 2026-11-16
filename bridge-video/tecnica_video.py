"""Extensão da ponte existente: trilha autoral sem criar registros no banco."""
import asyncio, base64, hashlib, html, json, re, shutil, subprocess, tempfile, time, wave
from pathlib import Path
from urllib.request import Request, urlopen

BASE = Path(__file__).resolve().parent
RESOURCE = BASE if (BASE / 'tecnica-trilha.json').exists() else BASE.parent / 'public'

def carregar(cfg):
    # Usa a cópia distribuída com a atualização; consulta pública não leva sessão.
    local = json.loads((RESOURCE / 'tecnica-trilha.json').read_text(encoding='utf-8'))
    if local.get('schema') != 1 or not local.get('lessons'):
        raise ValueError('Manifesto da trilha incompatível')
    return local

def assinatura(lesson):
    return hashlib.sha256(json.dumps(lesson, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]

def documento(lesson, stage, cfg):
    image = RESOURCE / ('avatar-mentor.png' if stage < 0 else 'avatar-mentor-chart.png')
    portrait = 'data:image/png;base64,' + base64.b64encode(image.read_bytes()).decode()
    s = {'title':'Abertura', 'text':lesson['summary'], 'svg':''} if stage < 0 else lesson['stages'][stage]
    e = html.escape
    return '''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#0A0C10;color:#E7EBF2;font-family:Arial,sans-serif;font-variant-numeric:tabular-nums}
    body{padding:3vh 3vw;display:flex;flex-direction:column;gap:1.5vh}header{color:#D4A017;font-size:clamp(15px,2vw,25px)}h1{font-size:clamp(22px,3vw,42px);margin:0}h2{font-size:clamp(18px,2vw,28px);margin:0}
    main{display:flex;gap:2vw;flex:1;min-height:0;align-items:center}.chart{flex:1;min-width:0}.chart svg{width:100%;max-height:55vh}aside{width:27%;height:100%;display:flex;align-items:center}aside img{width:100%;max-height:54vh;object-fit:contain}body.intro aside{width:48%}
    #caption{min-height:17vh;font-size:clamp(19px,2vw,30px);line-height:1.4;text-align:center;color:#B7C0CF}#caption b{font-weight:500}#caption b.spoken{color:#E7EBF2}#caption b.current{color:#D4A017}footer{font-size:clamp(12px,1.1vw,18px);color:#B7C0CF}
    @media(max-aspect-ratio:4/5){main{flex-direction:column}aside,body.intro aside{width:100%;height:25vh}aside img{max-height:25vh}.chart{width:100%}.chart svg{max-height:32vh}h1{font-size:34px}h2{font-size:28px}#caption{font-size:30px;min-height:22vh}footer{font-size:18px}}
    </style><body class="''' + ('intro' if stage < 0 else '') + '''"><header>DIÁRIO DE TRADER · ANÁLISE TÉCNICA NA PRÁTICA</header><h1>''' + e(lesson['title']) + '</h1><h2>' + e(s['title']) + '</h2><main><div class="chart">' + (s['svg'] if stage >= 0 else '<p>'+e(lesson['reference'])+'</p>') + '</div><aside><img src="' + portrait + '" alt="Avatar Mentor"></aside></main><div id="caption"></div><footer>Exemplo autoral hipotético · Conteúdo educacional · Mentor ilustrado, sem sincronização labial</footer></body></html>'

async def gravar(p, lesson, cfg, voice, rate, fmt, output, sem_voz=False):
    from playwright.async_api import async_playwright
    ff=p.ffmpeg_bin(); _,width,height,_=fmt
    with tempfile.TemporaryDirectory(prefix='tecnica_') as tmpname:
        tmp=Path(tmpname); frames=[]; sound=bytearray(); counter=0
        async with async_playwright() as pw:
            browser=await pw.chromium.launch()
            try:
                page=await browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
                for stage in range(-1,4):
                    await page.set_content(documento(lesson,stage,cfg))
                    await page.evaluate('()=>document.fonts.ready')
                    await page.wait_for_function('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)')
                    text=lesson['summary'] if stage<0 else lesson['stages'][stage]['text']
                    p.diga(f"  {lesson['title']} · etapa {stage+2}/5")
                    # Uma legenda por frase evita um bloco de texto cortado em 9:16.
                    for phrase in re.split(r'(?<=[.!?])\s+',text):
                        if not phrase.strip():continue
                        words=phrase.split()
                        await page.evaluate("t=>{const c=document.getElementById('caption');c.replaceChildren();t.split(/\\s+/).forEach((w,i)=>{if(i)c.append(' ');const b=document.createElement('b');b.textContent=w;c.append(b)})}",phrase)
                        if sem_voz:
                            duration=max(1.2,len(phrase)/14.5); marks=[duration*q/len(words) for q in range(len(words))];sound+=p.silencio(duration)
                        else:
                            mp3=tmp/f'{counter}.mp3';wav=tmp/f'{counter}.wav'
                            for attempt in range(3):
                                try:
                                    marks=await p.tts(phrase,voice,rate,mp3);break
                                except Exception:
                                    if attempt == 2:raise
                                    await asyncio.sleep(2)
                            duration=p.para_wav(ff,mp3,wav)
                            with wave.open(str(wav),'rb') as w:sound+=w.readframes(w.getnframes())
                        if len(marks)!=len(words):marks=[duration*q/len(words) for q in range(len(words))]
                        marks=[0]+marks[1:]+[duration]
                        for q in range(len(words)):
                            await page.evaluate("q=>document.querySelectorAll('#caption b').forEach((b,i)=>{b.classList.toggle('spoken',i<q);b.classList.toggle('current',i===q)})",q)
                            img=tmp/f'img{len(frames):06d}.jpg';await page.screenshot(path=str(img),type='jpeg',quality=88)
                            frames.append((img,max(.001,marks[q+1]-marks[q])))
                        pause=.9 if phrase.endswith('?') else .18
                        frames.append((frames[-1][0],pause));sound+=p.silencio(pause);counter+=1
            finally:
                await browser.close()
        wavfile=tmp/'voz.wav'
        with wave.open(str(wavfile),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(p.TAXA);w.writeframes(bytes(sound))
        listing=tmp/'frames.txt'
        with listing.open('w',encoding='utf-8') as f:
            for img,d in frames:f.write(f"file '{img.as_posix()}'\nduration {d:.6f}\n")
            f.write(f"file '{frames[-1][0].as_posix()}'\n")
        output.parent.mkdir(parents=True,exist_ok=True)
        subprocess.run([ff,'-y','-loglevel','error','-f','concat','-safe','0','-i',str(listing),'-i',str(wavfile),'-vf',f'fps=30,scale={width}:{height},format=yuv420p','-c:v','libx264','-preset','veryfast','-crf','24','-c:a','aac','-b:a','96k','-shortest','-movflags','+faststart',str(output)],check=True)
    return output

def processar(p,cfg,manual=False):
    data=carregar(cfg);lessons=data['lessons'];auto=cfg.get('auto',{})
    formats=auto.get('fmts',['1']);voice=auto.get('voz','pt-BR-AntonioNeural');rate=auto.get('taxa','+0%')
    if manual:
        for i,l in enumerate(lessons,1):p.diga(f"{i:2}. {l['title']}")
        number=int(p.pergunta('Número da aula da trilha','1'))
        if number<1 or number>len(lessons):raise ValueError('Escolha um número da lista')
        lessons=[lessons[number-1]]
    account=p.entrar(cfg)['user']['id']
    for lesson in lessons:
        digest=assinatura(lesson)
        for k in formats:
            fmt=p.FORMATOS[k];key=f"{account}|{lesson['id']}|{digest}|{fmt[0]}|{voice}|{rate}"
            # Sucesso só após upload; falhas de envio são repetidas no próximo ciclo.
            done=cfg.setdefault('tecnica_feitos',{})
            if done.get(key) and not manual:continue
            p.diga('Trilha técnica: '+lesson['title'])
            output=p.pasta_saida(cfg)/(lesson['id']+'-'+digest+'-'+fmt[0]+'.mp4')
            if not output.exists():asyncio.run(gravar(p,lesson,cfg,voice,rate,fmt,output))
            session=p.entrar(cfg)
            if session['user']['id'] != account:raise RuntimeError('A conta mudou; geração interrompida.')
            if p.envia_video(session,lesson['id'],fmt[0],output):
                done[key]=time.strftime('%Y-%m-%d %H:%M');p.grava_cfg(cfg);p.diga('Vídeo da trilha enviado ao app.')
            else:
                p.diga('Vídeo salvo no PC; envio será tentado no próximo ciclo.')
