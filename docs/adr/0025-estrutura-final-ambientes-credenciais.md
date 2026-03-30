# ADR 0025: Estrutura Final de Ambientes e Credenciais

**Data:** 30 de março de 2026
**Status:** Aceito

## 1. Contexto
O projeto passou por uma migração não planejada do Replit para Render em 26/03/2026, quando uma rotação de credenciais disparou um deploy automático do código novo. Isso gerou confusão sobre qual ambiente e quais credenciais estavam ativos. Este ADR documenta a estrutura final estabilizada.

## 2. Estrutura de Produção

### Ambientes
- **Formulário Web:** api-auditoria-prontuarios.onrender.com (Render, conta corporativa)
- **Data Warehouse:** Google BigQuery, projeto comissao-prontuario
- **Transformação:** dbt Cloud, job "Carga Diaria - Auditorias" (plano Developer gratuito)
- **BI:** Looker Studio conectado a gold_auditorias_consolidadas

### Datasets BigQuery
- prontuarios_dados: tabelas Bronze (dados brutos)
- dbt_qualidadehsr: tabelas Silver e Gold (modelos dbt)

### Service Accounts (projeto comissao-prontuario)
- aplicacao-formulario: usada pelo Render para gravar na Bronze
- dbt-orquestrador: usada pelo dbt Cloud e profiles.yml local
- looker-studio-bi: usada pelo Looker Studio (read-only)

## 3. Ambientes Desativados
- Replit: aplicação expirou, código está no GitHub
- Projeto GCP auditoria-de-prontuarios: encerrado em 30/03/2026 (conta pessoal)
- Render pessoal (auditoria-de-prontuarios.onrender.com): desativado
- GitHub Actions (cron pipeline legado): desativado em 29/03/2026, mantido workflow_dispatch

## 4. Consequências
- **Positivas:** Ambiente simplificado com um único projeto GCP, três service accounts com least privilege, e deploy automatizado via GitHub
- **Negativas:** Migração não planejada causou confusão temporária e exposição acidental de credencial (rotacionada imediatamente)

## 5. Lições Aprendidas
- Sempre rotacionar credenciais imediatamente após exposição
- Manter documentação de ambientes atualizada para evitar confusão em incidentes
- Deploy automático via GitHub pode causar migrações não planejadas quando credenciais são atualizadas