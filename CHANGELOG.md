# Registo de Alterações (Changelog)

Todos os aspectos notáveis de alterações a este projeto serão documentados neste ficheiro.

O formato baseia-se no standard [Keep a Changelog](https://keepachangelog.com/),
e este projeto adere à [Versionação Semântica](https://semver.org/).

## [1.5.0] - 2026-03-10

### Adicionado
- **Documentação de Arquitetura (ADR 0005):** Adicionado registro de decisão detalhando a modelagem EAV (Entity-Attribute-Value) para superação do 'Wide Table Problem' dos dados legados.
- **Scripts de ETL & Helpers:** Inclusão dos scripts SQL (`etl/silver_detalhes.sql`) com comandos `MERGE` e `UNPIVOT`, além do utilitário `scripts/gera_colunas_unpivot.sql` para manutenção do BigQuery.
- **Mecanismos de Integridade:** Implementação nativa de geração de `UUIDv4` para cada detalhe de resposta, habilitando deduplicação e idempotência na camada Silver.

### Alterado
- **Atualização do `ARCHITECTURE.md`:** Refinamento da documentação técnica para distinguir corretamente Ingestão Near-real-time (BigQuery Streaming) de bancos OLTP, e detalhamento de consumo analítico via Views.
- **Pipeline de Dados Legados:** A estrutura horizontal de mais de 600 colunas foi oficialmente convertida para o modelo vertical (EAV), preparando o terreno para a visualização no Looker Studio sem *pivot* manual.

### Fixado
- **Resolução do 'Wide Table Problem':** Ingestão bem-sucedida de **104.820 linhas** históricas na tabela `detalhes_respostas` (Camada Silver) superando limites analíticos anteriores.
- **Hotfix de Infraestrutura (Render.com):** Reversão (Rollback) de emergência para a versão `Oct/2025` na URL legada devido a um conflito de Auto-Deploy gerado por atualizações no repositório corporativo. Funcionalidade de Auto-Deploy desativada no serviço legado para garantir o isolamento e a estabilidade da operação do hospital.

## [1.4.0] - 2026-03-09
### Adicionado
- Implementação de rotina de UPSERT (`MERGE`) no script `etl/silver_cabecalho.sql` para consolidação do cabeçalho legado.
- Regra de Data Cleansing na camada Silver (tratamento de nulos e remoção de duplicidades baseada na chave de unicidade ampliada).
- Configuração de automação no BigQuery (Scheduled Queries) para atualizar a tabela `respostas` a cada 6 horas, de forma autônoma.

## [1.3.0] - 2026-03-05

### Adicionado
- Pipeline de ETL automatizado construído em Python e Polars para extração em lote do histórico legado no Google Sheets.
- Orquestração de CI/CD via GitHub Actions (`etl.yml`), com *cron jobs* programados para rodar rotinas de extração diárias às 06h, 12h e 18h (Horário de Cuiabá).
- Adoção da Arquitetura Medalhão (*Medallion Architecture*), criando a tabela `bronze_legado_respostas` no Google BigQuery para armazenamento imutável dos dados brutos.
- Criação do `ADR 004` documentando a adoção do ecossistema Python/Polars e a separação do pipeline analítico.

### Alterado
- Reestruturação da documentação arquitetural corporativa: os ADRs foram migrados do arquivo principal para a pasta dedicada `docs/adr/`.
- Atualização do `pull_request_template` para contemplar checklists de Engenharia de Dados, CI/CD e validação de scripts Python.
- O `ARCHITECTURE.md` foi reescrito para refletir a nova natureza poliglota do monorepo (Node.js para ambiente transacional em tempo real e Python para processamento em lote).

## [1.2.0] - 2026-03-04

### Adicionado
- Implementação de identidade visual no front-end da aplicação web.
- Padronização da paleta de cores com `CSS` na tela de fundo e nos botões.
- Criação de travas de segurança de UX em campos de inserção de datas.

## [1.1.0] - 2026-02-26

### Adicionado
- Integração completa com a API do Google BigQuery através do SDK oficial (`@google-cloud/bigquery`).
- Geração de identificadores únicos universais (UUIDv4) via Node.js para garantir a integridade relacional entre cabeçalhos e detalhes.
- Implementação do padrão de segurança *Fail Fast* no arranque do servidor para validar credenciais de ambiente antes de expor as rotas HTTP.
- Estruturação completa da documentação corporativa (ADR, Guia de Contribuição, Changelog e Templates de PR).

### Alterado
- Arquitetura de armazenamento transitou do Google Sheets para o BigQuery de forma a mitigar o problema de latência e colunas excessivas (*Wide Table Problem*) no Looker Studio.
- Modelagem de dados convertida para o padrão EAV (Entity-Attribute-Value), separando o *payload* do formulário em duas tabelas físicas relacionais (`respostas` e `detalhes_respostas`).
- Otimização do método de análise iterativa das respostas utilizando `Object.entries()` para tratamento assíncrono do *payload*.

### Removido
- Limitação de escala e concorrência de acessos prévia associada à persistência direta na folha de cálculo legada.

## [1.0.0] - 2025-09-15

### Adicionado
- Lançamento da versão inicial (MVP) do Sistema de Auditoria de Prontuários.
- Formulário web dinâmico (Front-End) com listas de setores e especialidades carregadas de forma assíncrona.
- Integração primária com a API do Google Sheets v4 para persistência de dados.
- Estrutura base do servidor em Node.js e Express.