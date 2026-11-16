import json, tempfile, types, unittest
from pathlib import Path
from unittest.mock import patch
import tecnica_video as t

class Integration(unittest.TestCase):
    def test_manifest_and_assets(self):
        data=t.carregar({})
        self.assertEqual(len(data['lessons']),18)
        self.assertEqual(len({x['id'] for x in data['lessons']}),18)
        for l in data['lessons']:
            self.assertEqual(len(l['stages']),4)
            self.assertTrue(all('<svg' in s['svg'] and s['text'] for s in l['stages']))
        doc=t.documento(data['lessons'][0],0,{})
        self.assertIn('data:image/png;base64,',doc)
        self.assertNotIn('<script',doc)

    def test_failed_upload_retries_without_render_then_skips_success_per_account_format(self):
        lesson=t.carregar({})['lessons'][0]
        with tempfile.TemporaryDirectory() as folder:
            events=[];saves=[];upload=[False,True,True,True];account=['user-a']
            p=types.SimpleNamespace(FORMATOS={'1':('16x9',1920,1080,'ajustar'),'2':('9x16',1080,1920,'ajustar')},diga=lambda *a:None,pasta_saida=lambda cfg:Path(folder),entrar=lambda cfg:{'user':{'id':account[0]}},envia_video=lambda *a:upload.pop(0),grava_cfg=lambda cfg:saves.append(json.loads(json.dumps(cfg))))
            async def render(p,l,c,v,r,fmt,out):events.append(fmt[0]);out.write_bytes(b'mp4');return out
            cfg={'auto':{'fmts':['1']}}
            with patch.object(t,'carregar',return_value={'lessons':[lesson]}),patch.object(t,'gravar',side_effect=render):
                t.processar(p,cfg);self.assertEqual(cfg['tecnica_feitos'],{})
                t.processar(p,cfg);self.assertEqual(len(events),1);self.assertEqual(len(saves),1)
                t.processar(p,cfg);self.assertEqual(len(events),1);self.assertEqual(len(saves),1)
                cfg['auto']['fmts']=['1','2'];t.processar(p,cfg);self.assertEqual(events,['16x9','9x16'])
                account[0]='user-b';cfg['auto']['fmts']=['1'];t.processar(p,cfg)
                self.assertEqual(len(cfg['tecnica_feitos']),3)

if __name__=='__main__':unittest.main()
