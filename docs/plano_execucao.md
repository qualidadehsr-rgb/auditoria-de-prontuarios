## Estimativa de Tempo por Entrega

**MVP (Entrega Mínima Viável):** Entrega 1 — Pipeline Legado. Com apenas a extração do Google Sheets e uma visualização básica no Looker Studio, os stakeholders já conseguiam ver dados históricos consolidados das 5 unidades sem esperar semanas de consolidação manual.

| Entrega | Escopo | Status | Tempo Estimado | Tempo Real |
|---------|--------|--------|---------------|------------|
| 1 - Pipeline Legado | Extração Sheets + BigQuery + GitHub Actions + BI básico | Concluído | 2 semanas | ~2 semanas (fev-mar/2026) |
| 2 - Pipeline Web + Unificação | API Node.js + dbt staging + Silver unificada + testes | Concluído | 2 semanas | ~2 semanas (mar/2026) |
| 3 - Camada Gold + Dashboard | Lógica binária + dicionário + LGPD + Looker Studio | Concluído | 2 semanas | ~1 semana (mar/2026) |
| 4 - Hardening e Observabilidade | CI/CD + resiliência Python + freshness + docs | Em progresso | 2 semanas | Pendente |