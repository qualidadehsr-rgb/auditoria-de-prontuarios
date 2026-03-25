# Fontes de Dados

| Fonte | Formato | Frequência | Método de Ingestão | Tabela Destino (Bronze) | Responsável |
|-------|---------|------------|--------------------|------------------------|-------------|
| Sistema Web (App Node.js) | JSON | Near-real-time | API POST (Express.js → BigQuery Streaming) | bronze_respostas_web | API Node.js |
| Sistema Legado (Google Sheets) | Planilha (600+ colunas horizontais) | Batch 3x/dia (cron: 10h, 16h, 22h UTC) | Python (Polars) + GitHub Actions | bronze_legado_respostas | Script etl/extracao_sheets.py |
| Configurações | Tabela BigQuery | Manual (sob demanda) | Inserção direta no BigQuery Console | configuracoes | Administrador do projeto |
| Dicionário de Perguntas | CSV (dicionario_oficial.csv) | Sob demanda (quando o formulário muda) | Script Python (scripts/extrai_dicionario_real.py) → CSV → Upload BigQuery | dim_perguntas | Gerado automaticamente a partir da constante ESTRUTURA_FORMULARIO do front-end |