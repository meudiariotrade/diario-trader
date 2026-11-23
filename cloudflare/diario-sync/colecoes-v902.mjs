// v902: tabela/colunas autorizadas para a migração privada. Nada de logs, Analytics ou dados públicos.
export const COLECOES=Object.freeze({
  "analises_trabalhos": {
    "owner": "user_id",
    "keys": [
      "id"
    ]
  },
  "atalhos_tokens": {
    "owner": "user_id",
    "keys": [
      "user_id"
    ]
  },
  "aulas": {
    "owner": "user_id",
    "keys": [
      "id"
    ]
  },
  "aulas_audio_jobs": {
    "owner": "user_id",
    "keys": [
      "id"
    ]
  },
  "aulas_fila": {
    "owner": "user_id",
    "keys": [
      "id"
    ]
  },
  "aulas_glossario_tts": {
    "owner": "user_id",
    "keys": [
      "user_id"
    ]
  },
  "aulas_imagens_jobs": {
    "owner": "user_id",
    "keys": [
      "id"
    ]
  },
  "carteira_cfg": {
    "owner": "user_id",
    "keys": [
      "user_id"
    ]
  },
  "carteira_relatorios": {
    "owner": "user_id",
    "keys": [
      "id"
    ]
  },
  "conhecimento_trading": {
    "owner": "owner_id",
    "keys": [
      "id"
    ]
  },
  "cotacoes": {
    "owner": "user_id",
    "keys": [
      "user_id",
      "ticker"
    ]
  },
  "diario_backup": {
    "owner": "user_id",
    "keys": [
      "user_id",
      "dia"
    ]
  },
  "estado_diario": {
    "owner": "user_id",
    "keys": [
      "user_id",
      "dia"
    ]
  },
  "fluxo_acoes": {
    "owner": "user_id",
    "keys": [
      "user_id",
      "dia",
      "ativo"
    ]
  },
  "fluxo_negocios": {
    "owner": "user_id",
    "keys": [
      "user_id",
      "trade_id"
    ]
  },
  "limpeza_backup": {
    "owner": "user_id",
    "keys": [
      "id"
    ]
  },
  "notas_inbox": {
    "owner": "user_id",
    "keys": [
      "id"
    ]
  },
  "noticias_urgentes_notificadas": {
    "owner": "user_id",
    "keys": [
      "user_id",
      "noticia_hash"
    ]
  },
  "opcoes_grade": {
    "owner": "user_id",
    "keys": [
      "user_id",
      "ativo"
    ]
  },
  "operacoes_profit": {
    "owner": "user_id",
    "keys": [
      "id"
    ]
  },
  "parceiro": {
    "owner": "user_id",
    "keys": [
      "user_id"
    ]
  },
  "profit_candles": {
    "owner": "uid",
    "keys": [
      "uid",
      "ativo",
      "t"
    ]
  },
  "profit_prints": {
    "owner": "user_id",
    "keys": [
      "id"
    ]
  },
  "push_subs": {
    "owner": "user_id",
    "keys": [
      "id"
    ]
  },
  "radar_cfg": {
    "owner": "user_id",
    "keys": [
      "user_id"
    ]
  },
  "radar_sinais": {
    "owner": "user_id",
    "keys": [
      "user_id",
      "dia",
      "ticker",
      "lado"
    ]
  },
  "resumos": {
    "owner": "uid",
    "keys": [
      "id"
    ]
  },
  "weekly_reports": {
    "owner": "user_id",
    "keys": [
      "user_id",
      "semana_fim"
    ]
  }
});
