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

def dicionario_voz():
    try: terms=dict(carregar({}).get('glossario',{}))
    except Exception: terms={}
    custom=BASE/'dicionario-voz.json'
    if custom.exists():
        data=json.loads(custom.read_text(encoding='utf-8')).get('terms',{})
        if not isinstance(data,dict) or len(data)>200:raise ValueError('Dicionário de voz inválido')
        terms.update(data)
    return {str(k).upper():str(v) for k,v in terms.items() if 0<len(str(k))<=40 and 0<len(str(v))<=180}

def normalizar_texto_para_voz(text):
    terms=dicionario_voz()
    if not terms:return str(text)
    pattern=r'(?<!\w)('+ '|'.join(re.escape(k) for k in sorted(terms,key=len,reverse=True))+r')(?!\w)'
    return re.sub(pattern,lambda m:terms[m.group().upper()],str(text),flags=re.I)

def manifesto_pdf(aula):
    lesson=aula['roteiro']['mentor']
    if len(lesson.get('stages',[]))!=4 or len(lesson.get('visuals',[]))!=4:raise ValueError('Aula do PDF incompleta')
    stages=[]
    for i,txt in enumerate(lesson['stages']):
        v=lesson['visuals'][i];title=str(v.get('title','Etapa'))[:70]
        svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 370"><rect width="760" height="370" fill="#0A0C10"/><text x="28" y="40" fill="#D4A017" font-size="21">'+html.escape(title)+'</text>'
        for j,item in enumerate(v.get('items',[])[:4]):
            import textwrap
            for k,line in enumerate(textwrap.wrap(str(item)[:105],58)[:2]):
                svg+='<text x="40" y="'+str(100+j*65+k*22)+'" fill="#E7EBF2" font-size="17">'+html.escape(line)+'</text>'
        svg+='</svg>'
        stages.append({'title':title,'text':str(txt),'roteiroVoz':lesson.get('roteiroVoz',{}).get('etapas',lesson['stages'])[i],'svg':svg})
    return {'id':str(aula['id']),'title':str(lesson['title']),'summary':str(lesson['summary']),'aberturaVoz':lesson.get('roteiroVoz',{}).get('abertura',lesson['summary']),'reference':str(lesson.get('reference','PDF enviado pelo usuário')),'stages':stages}

def assinatura(lesson):
    return hashlib.sha256(json.dumps(lesson, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]

def documento(lesson, stage, cfg):
    image = RESOURCE / ('avatar-mentor.png' if stage < 0 else 'avatar-mentor-chart.png')
    portrait = 'data:image/png;base64,' + base64.b64encode(image.read_bytes()).decode()
    clip=RESOURCE / 'avatar-talking.mp4'
    animation=('<video id="mentor-motion" muted loop playsinline preload="auto" src="data:video/mp4;base64,'+base64.b64encode(clip.read_bytes()).decode()+'"></video>') if clip.exists() else ''
    s = {'title':'Abertura', 'text':lesson['summary'], 'svg':''} if stage < 0 else lesson['stages'][stage]
    e = html.escape
    return '''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#0A0C10;color:#E7EBF2;font-family:Arial,sans-serif;font-variant-numeric:tabular-nums}
    body{padding:3vh 3vw;display:flex;flex-direction:column;gap:1.5vh}header{color:#D4A017;font-size:clamp(15px,2vw,25px)}h1{font-size:clamp(22px,3vw,42px);margin:0}h2{font-size:clamp(18px,2vw,28px);margin:0}
    main{display:flex;gap:2vw;flex:1;min-height:0;align-items:center}.chart{flex:1;min-width:0}.chart svg{width:100%;max-height:55vh}aside{width:27%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}aside img,aside video{width:100%;max-height:54vh;object-fit:contain}aside:has(video) img{display:none}body.intro aside{width:48%}
    #caption{min-height:17vh;font-size:clamp(19px,2vw,30px);line-height:1.4;text-align:center;color:#B7C0CF}#caption b{font-weight:500}#caption b.spoken{color:#E7EBF2}#caption b.current{color:#D4A017}footer{font-size:clamp(12px,1.1vw,18px);color:#B7C0CF}
    @media(max-aspect-ratio:4/5){main{flex-direction:column}aside,body.intro aside{width:100%;height:25vh}aside img,aside video{max-height:25vh}.chart{width:100%}.chart svg{max-height:32vh}h1{font-size:34px}h2{font-size:28px}#caption{font-size:30px;min-height:22vh}footer{font-size:18px}}
    </style><body class="''' + ('intro' if stage < 0 else '') + '''"><header>DIÁRIO DE TRADER · ANÁLISE TÉCNICA NA PRÁTICA</header><h1>''' + e(lesson['title']) + '</h1><h2>' + e(s['title']) + '</h2><main><div class="chart">' + (s['svg'] if stage >= 0 else '<p>'+e(lesson['reference'])+'</p>') + '</div><aside><img src="' + portrait + '" alt="Avatar Mentor">' + animation + '</aside></main><div id="caption"></div><footer>Exemplo autoral hipotético · Conteúdo educacional · Gestos em loop, sem sincronização labial</footer></body></html>'

async def gravar(p, lesson, cfg, voice, rate, fmt, output, sem_voz=False):
    from playwright.async_api import async_playwright
    ff=p.ffmpeg_bin(); _,width,height,_=fmt
    with tempfile.TemporaryDirectory(prefix='tecnica_') as tmpname:
        tmp=Path(tmpname); frames=[]; sound=bytearray(); counter=0; elapsed=0.0
        async with async_playwright() as pw:
            browser=await pw.chromium.launch()
            try:
                page=await browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
                for stage in range(-1,4):
                    await page.set_content(documento(lesson,stage,cfg))
                    await page.evaluate('()=>document.fonts.ready')
                    await page.wait_for_function('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)')
                    animated=await page.locator('#mentor-motion').count() > 0
                    if animated:
                        await page.wait_for_function('document.getElementById("mentor-motion").readyState>=2')
                    text=lesson.get('aberturaVoz',lesson['summary']) if stage<0 else lesson['stages'][stage].get('roteiroVoz',lesson['stages'][stage]['text'])
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
                            interval=max(.001,marks[q+1]-marks[q]); remaining=interval
                            while remaining>0.000001:
                                length=min(1/12,remaining) if animated else remaining
                                if animated:
                                    await page.evaluate('''async seconds=>{const v=document.getElementById('mentor-motion');v.pause();const target=seconds%v.duration;if(Math.abs(v.currentTime-target)<0.001)return;await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{v.removeEventListener('seeked',done);reject(new Error('Falha ao posicionar vídeo do mentor'))},10000);function done(){clearTimeout(timer);resolve()}v.addEventListener('seeked',done,{once:true});v.currentTime=target;})}''',elapsed)
                                img=tmp/f'img{len(frames):06d}.jpg';await page.screenshot(path=str(img),type='jpeg',quality=88)
                                frames.append((img,length));elapsed+=length;remaining-=length
                        pause=.9 if phrase.endswith('?') else .18
                        frames.append((frames[-1][0],pause));sound+=p.silencio(pause);elapsed+=pause;counter+=1
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
    return sum(d for _,d in frames)

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
        clip=RESOURCE/'avatar-talking.mp4'
        motion=hashlib.sha256(clip.read_bytes()).hexdigest()[:16] if clip.exists() else 'still'
        glossary=hashlib.sha256(json.dumps(dicionario_voz(),sort_keys=True,ensure_ascii=False).encode()).hexdigest()[:10]
        digest=assinatura(lesson)+'-'+motion+'-'+glossary
        for k in formats:
            fmt=p.FORMATOS[k];key=f"{account}|{lesson['id']}|{digest}|{fmt[0]}|{voice}|{rate}"
            # Sucesso só após upload; falhas de envio são repetidas no próximo ciclo.
            done=cfg.setdefault('tecnica_feitos',{})
            if done.get(key) and not manual:continue
            p.diga('Trilha técnica: '+lesson['title'])
            variant=hashlib.sha256((voice+'|'+rate).encode()).hexdigest()[:10]
            output=p.pasta_saida(cfg)/(lesson['id']+'-'+digest+'-'+fmt[0]+'-'+variant+'.mp4')
            if not output.exists() or not output.stat().st_size:
                pending=output.with_name(output.stem+'.partial.mp4')
                try:
                    asyncio.run(gravar(p,lesson,cfg,voice,rate,fmt,pending))
                    if not pending.exists() or not pending.stat().st_size:
                        raise RuntimeError('A geração não produziu um MP4 válido.')
                    pending.replace(output)
                finally:
                    pending.unlink(missing_ok=True)
            session=p.entrar(cfg)
            if session['user']['id'] != account:raise RuntimeError('A conta mudou; geração interrompida.')
            if p.envia_video(session,lesson['id'],fmt[0],output):
                done[key]=time.strftime('%Y-%m-%d %H:%M');p.grava_cfg(cfg);p.diga('Vídeo da trilha enviado ao app.')
            else:
                p.diga('Vídeo salvo no PC; envio será tentado no próximo ciclo.')
