# Fontes de Dados

| Fonte | Formato | Frequência | Método de Ingestão | Tabela Destino (Bronze) | Responsável |
|-------|---------|------------|--------------------|------------------------|-------------|
| Sistema Web (App Node.js) | JSON | Near-real-time | API POST (Express.js → BigQuery Streaming) | bronze_respostas_web | API Node.js |
| Sistema Legado (Google Sheets) | Planilha (600+ colunas horizontais) | Batch 3x/dia (cron: 10h, 16h, 22h UTC) | Python (Polars) + GitHub Actions | bronze_legado_respostas | Script etl/extracao_sheets.py |