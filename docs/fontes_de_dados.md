# Fontes de Dados

| Fonte | Formato | Frequência | Método de Ingestão | Tabela Destino (Bronze) | Responsável |
|-------|---------|------------|--------------------|------------------------|-------------|
| Sistema Web (App Node.js) | JSON | Near-real-time | API POST (Express.js → BigQuery Streaming) | bronze_respostas_web | API Node.js |
| Sistema Legado (Google Sheets) | Planilha (600+ colunas horizontais) | Batch 3x/dia (cron: 10h, 16h, 22h UTC) | Python (Polars) + GitHub Actions | bronze_legado_respostas | Script etl/extracao_sheets.py |
| Configurações | Tabela BigQuery | Manual (sob demanda) | Inserção direta no BigQuery Console | configuracoes | Administrador do projeto |
| Dicionário de Perguntas | CSV (dicionario_oficial.csv) | Sob demanda (quando o formulário muda) | Script Python (scripts/extrai_dicionario_real.py) → CSV → Upload BigQuery | dim_perguntas | Gerado automaticamente a partir da constante ESTRUTURA_FORMULARIO do front-end |


## Problemas Conhecidos por Fonte

### Sistema Legado (Google Sheets)
- Wide table com 600+ colunas horizontais — resolvido com UNPIVOT na camada Bronze (ADR 0005)
- Campos vazios em setor e especialidade — tratados com COALESCE na camada Silver
- Formato de timestamp inconsistente (dd/mm/yyyy HH:MM:SS com vírgula) — tratado com PARSE_TIMESTAMP na Silver
- Sem ID único nativo por submissão — resolvido com Surrogate Key MD5 (ADR 0021)

### Sistema Web (App Node.js)
- Dados sensíveis (CPFs, telefones) inseridos acidentalmente em campos de texto livre (observações) — mascarados com REGEXP_REPLACE na camada Gold (ADR 0011)
- Campos opcionais podem vir vazios (setor, especialidade) — tratados com COALESCE na Silver

### Dicionário de Perguntas (CSV)
- Depende da constante ESTRUTURA_FORMULARIO no front-end — se alguém alterar o formulário sem rodar o script extrai_dicionario_real.py, o dicionário fica desatualizado

### Tabela de Configurações
- Alimentação manual — risco de dados desatualizados se um setor ou especialidade nova for criado e ninguém atualizar a tabela


## Volumetria (atualizado em: março/2026)

| Fonte | Auditorias (Bronze) | Linhas após UNPIVOT (Silver) | Observação |
|-------|--------------------|-----------------------------|------------|
| Sistema Legado | 2.244 | ~104.800 | Volume estável — sistema antigo não recebe novos dados |
| Sistema Web | 1 | ~47 | Sistema novo em fase inicial de adoção pelas unidades |
| Total | 2.245 | ~104.850 | Tendência de crescimento conforme unidades migram para o sistema Web |


## SLAs de Atualização

| Fonte | Frequência de Ingestão | Warn (atraso tolerável) | Error (atraso crítico) | Justificativa |
|-------|----------------------|------------------------|----------------------|---------------|
| Sistema Legado (Sheets) | Batch 3x/dia (10h, 16h, 22h UTC) | 12 horas | 24 horas | Dados históricos, não há urgência — mas mais de 1 dia sem carga indica falha no pipeline |
| Sistema Web (API) | Near-real-time | 20 dias | 35 dias | Ciclo de auditoria é mensal: atendimentos chegam entre os dias 10-15, auditorias são realizadas nos dias seguintes |


## Consumo de Dados (BI)

**Plataforma:** Looker Studio (dashboard autoserviço, acesso gratuito para todos os usuários)

**Usuários:** Comissão de Prontuários, Coordenadores de Qualidade, Gestores das 5 unidades

**Dashboard:** 5 páginas (consolidado após reestruturação — versão anterior tinha 24 páginas)

**Filtros obrigatórios disponíveis:**
- Por empresa (unidade hospitalar)
- Por setor (UTI, Pronto Socorro, etc.)
- Por tipo de avaliação (Clínico, Cirúrgico, Obstétrico, etc.)
- Por especialidade médica
- Por período (intervalo de datas)

**Regra de performance (FinOps):** O Looker Studio realiza apenas operações de SUM sobre os campos qtde_conforme e qtde_validos. Toda lógica de negócio (classificação binária Conforme/Não conforme) está pré-calculada na camada Gold pelo dbt. É proibido criar campos calculados complexos ou filtros REGEX diretamente no Looker Studio.