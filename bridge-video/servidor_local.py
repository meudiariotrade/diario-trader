# -*- coding: utf-8 -*-
"""Servidor HTTP de vídeos na própria máquina (apenas loopback).
Não expõe LAN, não transfere arquivos ao Supabase e não requer senha da conta.
O iPhone precisa de importação local/AirDrop: 127.0.0.1 nele NÃO é o PC.
"""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import re
import threading
import json
import asyncio

_RUNNING=set()
_RUNNING_LOCK=threading.Lock()

PORT = 8766
ALLOWED_ORIGIN = "https://meudiariotrade.github.io"
NAME = re.compile(r"^([a-zA-Z0-9_-]{1,128})-(16x9|9x16|1x1)\.mp4$")


def create_handler(root):
    root = (Path(root) / ".diario-videos").resolve()


    def generate_job(aula,format):
        name=str(aula['id'])+'-'+format+'.mp4'
        target=root/name
        pending=root/(name+'.partial.mp4')
        try:
            if target.is_file() and target.stat().st_size:
                return
            import ponte_video
            cfg=ponte_video.le_cfg()
            voice=cfg.get('auto',{}).get('voz') or ponte_video.VOZES['1'][0]
            rate=cfg.get('auto',{}).get('taxa') or '+0%'
            video_format=next((v for v in ponte_video.FORMATOS.values() if v[0]==format),None)
            if video_format is None:
                return
            root.mkdir(parents=True,exist_ok=True)
            asyncio.run(ponte_video.gravar(aula,{},cfg,voice,rate,video_format,pending))
            if pending.is_file() and pending.stat().st_size:
                pending.replace(target)
        except Exception as err:
            print('Erro ao gerar vídeo da ponte local: '+str(err)[:180],flush=True)
        finally:
            pending.unlink(missing_ok=True)
            with _RUNNING_LOCK:
                _RUNNING.discard(name)

    class BridgeHandler(BaseHTTPRequestHandler):
        def log_message(self, fmt, *args):
            # Não registrar URL de vídeo nem nomes de arquivos em logs.
            return

        def _cors(self):
            origin = self.headers.get("Origin", "")
            if origin == ALLOWED_ORIGIN:
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Content-Type, Range")
                self.send_header("Access-Control-Allow-Private-Network", "true")
                self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
                self.send_header("Vary", "Origin")

        def do_OPTIONS(self):
            if self.headers.get("Origin", "") != ALLOWED_ORIGIN:
                self.send_error(403)
                return
            self.send_response(204)
            self._cors()
            self.end_headers()

        def do_POST(self):
            if self.headers.get("Origin","") == ALLOWED_ORIGIN and urlsplit(self.path).path == "/voz":
                return self._voz()
            if self.headers.get("Origin","") != ALLOWED_ORIGIN or urlsplit(self.path).path != "/aula":
                self.send_error(403)
                return
            try:
                size=int(self.headers.get("Content-Length","0"))
                if size<50 or size>2*1024*1024:
                    self.send_error(413);return
                data=json.loads(self.rfile.read(size).decode('utf-8'))
                aula=data.get("aula") or {}
                fmt=data.get("formato") or "16x9"
                aid=str(aula.get("id",""))
                mentor=(aula.get("roteiro") or {}).get("mentor") or {}
                if not NAME.fullmatch(aid+"-"+fmt+".mp4") or len(mentor.get("stages",[]))!=4 or len(mentor.get("visuals",[]))!=4:
                    self.send_error(400);return
                name=aid+"-"+fmt+".mp4"
                with _RUNNING_LOCK:
                    if name not in _RUNNING:
                        _RUNNING.add(name)
                        threading.Thread(target=generate_job,args=(aula,fmt),daemon=True,name="mentor-"+aid[:12]).start()
                body=b'{"ok":true,"local":true}'
                self.send_response(202);self._cors()
                self.send_header("Content-Type","application/json")
                self.send_header("Content-Length",str(len(body)))
                self.end_headers();self.wfile.write(body)
            except Exception:
                self.send_error(400)

        def _voz(self):
            # v860: narração das aulas no app (Estudos > Mentor) com a mesma voz neural dos vídeos. Só no PC.
            try:
                size=int(self.headers.get("Content-Length","0"))
                if size<2 or size>64*1024:
                    self.send_error(413);return
                data=json.loads(self.rfile.read(size).decode("utf-8"))
                texto=str(data.get("text") or "").strip()
                if len(texto)<2 or len(texto)>6000:
                    self.send_error(400);return
                import ponte_video, tempfile, os
                cfg=ponte_video.le_cfg()
                voz=cfg.get("auto",{}).get("voz") or ponte_video.VOZES["1"][0]
                taxa=cfg.get("auto",{}).get("taxa") or "+0%"
                fd,tmp=tempfile.mkstemp(suffix=".mp3");os.close(fd)
                try:
                    asyncio.run(ponte_video.tts(texto,voz,taxa,tmp))
                    body=Path(tmp).read_bytes()
                finally:
                    Path(tmp).unlink(missing_ok=True)
                if not body:
                    self.send_error(502);return
                self.send_response(200);self._cors()
                self.send_header("Content-Type","audio/mpeg")
                self.send_header("Content-Length",str(len(body)))
                self.send_header("Cache-Control","no-store")
                self.end_headers();self.wfile.write(body)
            except Exception as err:
                print("Erro na voz da ponte: "+str(err)[:160],flush=True)
                try: self.send_error(502)
                except Exception: pass

        def do_GET(self):
            origin = self.headers.get("Origin", "")
            if origin and origin != ALLOWED_ORIGIN:
                self.send_error(403)
                return
            path = urlsplit(self.path).path
            if path == "/health":
                self.send_response(200)
                self._cors()
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", "11")
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(b'{"ok":true}')
                return
            if not path.startswith("/video/") or not NAME.fullmatch(path[7:]):
                self.send_error(404)
                return
            f = root / path[7:]
            if not f.is_file() or not f.resolve().is_relative_to(root):
                self.send_error(404)
                return
            size = f.stat().st_size
            if size == 0:
                self.send_error(404)
                return
            start, end = 0, size - 1
            hdr = self.headers.get("Range")
            if hdr:
                m = re.fullmatch(r"bytes=(\d+)-(\d*)", hdr.strip())
                if not m:
                    self.send_error(416)
                    return
                start = int(m.group(1))
                end = int(m.group(2)) if m.group(2) else size - 1
                if start >= size or end >= size or end < start:
                    self.send_error(416)
                    return
            length = end - start + 1
            self.send_response(206 if hdr else 200)
            self._cors()
            self.send_header("Content-Type", "video/mp4")
            self.send_header("Accept-Ranges", "bytes")
            if hdr:
                self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Content-Length", str(length))
            self.send_header("Cache-Control", "private, no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            try:
                with f.open("rb") as src:
                    src.seek(start)
                    while length:
                        part = src.read(min(131072, length))
                        if not part:
                            break
                        self.wfile.write(part)
                        length -= len(part)
            except (BrokenPipeError, ConnectionResetError):
                pass

    return BridgeHandler


def servir(root):
    with ThreadingHTTPServer(("127.0.0.1", PORT), create_handler(root)) as server:
        print(f"Ponte local de vídeos ativa em http://127.0.0.1:{PORT} (somente PC)", flush=True)
        server.serve_forever(poll_interval=0.25)


def iniciar(root):
    thread = threading.Thread(target=servir, args=(root,), daemon=True, name="ponte-video-local")
    thread.start()
    return thread


if __name__ == "__main__":
    import ponte_video
    servir(ponte_video.pasta_saida(ponte_video.le_cfg()))
