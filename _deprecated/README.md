# Arquivos Descontinuados

Os arquivos nesta pasta foram utilizados antes da adoção do dbt (Data Build Tool) e estão mantidos apenas como registro histórico.

Os modelos válidos e ativos estão em `models/` (Bronze, Silver, Gold).

## Arquivos movidos
- `gold_dim_perguntas.sql` → substituído por `models/bronze/stg_bronze_dim_perguntas.sql`
- `gold_view_consolidada.sql` → substituído por `models/gold/gold_auditorias_consolidadas.sql`
- `silver_detalhes_respostas.sql` → substituído por `models/silver/silver_detalhes.sql`
- `silver_respostas.sql` → substituído por `models/silver/silver_respostas.sql`
- `gera_colunas_unpivot.sql` → substituído por Jinja dinâmico no `stg_bronze_detalhes_respostas_legado.sql`