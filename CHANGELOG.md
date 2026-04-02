# Registo de Alterações (Changelog)

Todos os aspectos notáveis de alterações a este projeto serão documentados neste ficheiro.

O formato baseia-se no standard [Keep a Changelog](https://keepachangelog.com/),
e este projeto adere à [Versionação Semântica](https://semver.org/).

# Changelog
Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato baseia-se em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.15.0] - 2026-04-02

### Adicionado
- **Script `atualiza_dicionario.py`:** Automatização da carga do dicionário de perguntas diretamente no BigQuery, eliminando o CSV intermediário e o processo manual.
- **Google Secret Manager:** Credenciais da `dbt-orquestrador` migradas para cofre de secrets do GCP, eliminando dependência de arquivo `.env` local entre ambientes.
- **ADR 0026:** Decisão de uso do Google Secret Manager para credenciais.
- **ADR 0027:** Decisão de eliminar o CSV intermediário do fluxo do dicionário.
- **ADR 0028:** Política de retenção de dados — 10 anos para Bronze e Silver, custo estimado R$ 0,02/mês.
- **`docs/matriz_acesso.md`:** Criado documento formal de matriz de acesso com service accounts, usuários e histórico de alterações.
- **Resiliência `atualiza_dicionario.py`:** Adicionado logging estruturado (JSON) e try/except com raise no bloco principal — erros são capturados, logados e relançados corretamente.

### Corrigido
- **Dicionário de perguntas:** Adicionadas 75 perguntas do tipo Obstétrico que estavam ausentes, causando `pergunta_formatada = NULL` na Gold.
- **Staging `stg_bronze_detalhes_respostas_web`:** Normalização de acentos e substituição de `&` por `_` nos códigos de pergunta vindos do formulário web.
- **Staging `stg_bronze_respostas_web`:** Normalização de acento no campo `tipo_avaliacao`.
- **Inconsistência de encoding:** Padronizado padrão sem acento nos `codigo_base` — alinhando dados históricos (legado) e novos (formulário web).

### Segurança
- **IAM revisado:** Removido papel `Administrador do BigQuery` da `aplicacao-formulario`. Removido acesso da `robo-salva-planilha` (projeto encerrado) do projeto `comissao-prontuario`.
- **Chaves órfãs deletadas:** `aplicacao-formulario` e `dbt-orquestrador` reduzidas a 1 chave ativa cada.
- **Usuário de jobs adicionado:** `aplicacao-formulario` recebeu papel `Usuário de jobs do BigQuery` necessário para execução de queries.


## [1.14.0] - 2026-03-30
### Adicionado (Modelagem & Refatoração)
- **Macros Reutilizáveis:** Criação de `clean_empty_string` (tratamento de campos vazios) e `flag_conformidade`/`flag_valido` (lógica binária de conformidade), eliminando código duplicado na Silver e Gold.
- **UNPIVOT Dinâmico:** Substituição de 300+ colunas hardcoded no `stg_bronze_detalhes_respostas_legado.sql` por geração automática via Jinja (`adapter.get_columns_in_relation`), eliminando manutenção manual.
- **ADR 0024:** Justificativa da escolha de Node.js + Express para ingestão web.
- **ADR 0025:** Documentação da estrutura final de ambientes e credenciais após migração.

### Alterado (Organização & Performance)
- **Remoção de SELECT *:** Modelos de staging agora listam colunas explicitamente (exceto legado com 600+ colunas, justificado com comentário).
- **Repositório Organizado:** Scripts SQL legados movidos para pasta `_deprecated/` com README explicativo.
- **Source Freshness:** SLAs ajustados para ciclo mensal de auditoria (warn: 20 dias, error: 35 dias) e freshness movido para dentro do bloco config (compatibilidade dbt Cloud 2.0).
- **Contratos de Dados:** Adicionados testes para tipo_avaliacao, especialidade, qtde_conforme e qtde_validos na camada Gold. Descriptions em todas as colunas da Silver e Gold.

### Corrigido
- **Mascaramento LGPD:** Restaurado REGEXP_REPLACE na camada Gold que foi perdido na migração para dbt.
- **dbt Cloud:** Corrigido erro de parsing do freshness na versão 2.0-preview.

### Segurança
- **Rotação de Credenciais:** Chave exposta acidentalmente foi rotacionada. Render migrado para service account `aplicacao-formulario@comissao-prontuario`.
- **Pipeline Legado:** Cron do GitHub Actions desativado (planilha não recebe mais dados).
- **Projeto GCP Pessoal:** Projeto `auditoria-de-prontuarios` encerrado, tudo centralizado em `comissao-prontuario`.

## [1.13.0] - 2026-03-24
### Adicionado (Arquitetura & dbt)
- **Transformação em Nuvem (dbt):** Implementação completa do pipeline de transformação utilizando o dbt (Data Build Tool) conectado ao BigQuery, substituindo transformações manuais por modelos SQL escaláveis.
- **Unificação Híbrida de Dados:** Criação da tabela final `gold_auditorias_consolidadas`, unindo com sucesso as duas fontes de ingestão do hospital (Pipeline Legado do Google Sheets + API Web em Tempo Real) em uma única "Single Source of Truth".
- **Geração de Chaves Inteligentes:** Implementação de *Surrogate Keys* (Chaves Substitutas) com hash MD5 para garantir unicidade perfeita entre os sistemas legados e web (documentado na ADR 0021).
- **Contratos de Dados e Qualidade:** Criação dos arquivos `schema.yml` nas camadas Bronze, Silver e Gold com testes automatizados de integridade (not_null, unique) nativos do dbt.
- **Documentação de Decisões Técnicas:** Inclusão das ADRs 0018 (Limpeza de metadados em Staging), 0019 (Unpivot de legado com dbt_utils), 0020 (Extração dinâmica de JSON) e 0021 (Surrogate Keys).

### Alterado (Performance & BI)
- **Otimização do Looker Studio:** O dashboard corporativo foi redirecionado para consumir exclusivamente a camada Gold materializada pelo dbt.
- **Redução de Latência (FinOps):** A carga de processamento pesado (Pivots complexos e cálculos EAV) foi transferida da ferramenta de BI para o banco de dados (BigQuery) durante a madrugada. Resultado: redução drástica no tempo de carregamento das 24 páginas do relatório para o usuário final.

### Segurança (Git)
- **Reforço de Variáveis de Ambiente:** Confirmação de isolamento do arquivo `.env` via `.gitignore` para proteção das credenciais do BigQuery em máquinas locais.

## [1.12.0] - 2026-03-19
### Alterado
- Fluxo de submissão de dados simplificado para Ingestão Pura.

### Removido
- Inserção manual nas tabelas `silver_respostas` e `silver_detalhes_respostas` via API Node.js.

### Fixado
- Risco de quebra de atomicidade (ACID) durante a submissão do formulário.


## [1.11.0] - 2026-03-18
### Adicionado
- Inicialização da estrutura padrão de projeto dbt via dbt Cloud (criação de diretórios `models`, `seeds`, arquivo `dbt_project.yml`, etc).
- Integração do dbt Cloud ao repositório GitHub (`auditoria-de-prontuarios`).
- Configuração de credenciais de acesso do dbt ao Google BigQuery utilizando a Service Account `dbt-orquestrador`.

### Alterado
- O fluxo de desenvolvimento de dados passa a ser feito em nuvem (dbt Cloud) e versionado obrigatoriamente via Pull Requests para a `main`.


## [1.10.0] - 2026-03-17
### Adicionado (FinOps)
- **Cálculo de Taxa de Conformidade:** Implementação de lógica binária (`CASE WHEN`) na Camada Gold (`gold_view_consolidada`) para criação das métricas `qtde_conforme` e `qtde_valida`. Esta abordagem transfere a carga de processamento para o BigQuery, permitindo que o Looker Studio realize apenas somas simples, reduzindo o custo de latência e processamento do dashboard.

### Segurança (Git)
- **Proteção de Credenciais:** Atualização do ficheiro `.gitignore` com padrões wildcard (`comissao-prontuario-*.json`) para prevenir o rastreio acidental de chaves de Contas de Serviço (JSON) do Google Cloud, reforçando a conformidade com a política de segurança de credenciais.

### Alterado (Documentação)
- Início da revisão da taxonomia das tabelas para o padrão Medalhão e mapeamento de dependências para futura automação via Dataform.


## [1.9.0] - 2026-03-17

### Adicionado (Security)
- **IAM (Privilégio Mínimo):** Criação de Service Account isolada (`looker-studio-bi`) no Google Cloud para consumo de BI, configurada estritamente com permissões de Leitura (`dataViewer`) e Execução de Consultas (`jobUser`), mitigando riscos de alteração acidental na base de dados.


## [1.8.0] - 2026-03-13

### Adicionado (API)
- **Validação de Contrato (Schema Validation):** Criação de segurança/middleware na rota POST para bloquear pacotes vazios ou sem campos obrigatórios, protegendo a ingestão na Camada Bronze/Silver.
- **Conformidade LGPD (Data Masking):** Implementação de dupla barreira de proteção de dados sensíveis (Privacy by Design).
  - *Front-end:* Inclusão de "Nudge" visual (aviso de privacidade) no campo de observação para evitar a inserção do nome do paciente.
  - *Data Warehouse:* Adição de Censor Matemático (`REGEXP_REPLACE`) na Camada Gold (`gold_view_consolidada`) para mascarar dinamicamente (`[CENSURADO]`) sequências numéricas (CPFs, RGs, Telefones) inseridas acidentalmente nos textos livres.
- **Qualidade de Dados (Data Quality com dbt):** Integração do `dbt` (Data Build Tool) como auditor independente da base de dados (Defesa em Profundidade).
    - Implementação de Contratos de Dados (Data Contracts) na Camada Prata (`silver_respostas` e `silver_detalhes_respostas`) através do ficheiro declarativo `schema.yml`.
    - Adição de testes automatizados (`not_null`, `unique`, `accepted_values`) para validar a integridade das submissões da API.
    - Criação de uma "Linha de Base" (Baseline) para isolar e documentar a dívida técnica de registos históricos inconsistentes através de filtros SQL nativos.


## [1.7.0] - 2026-03-12

### Adicionado (API)
- Implementação de **Middleware de Observabilidade** para rastreamento de requisições.
- Geração de `request_id` único (UUIDv4) injetado no ciclo de vida de cada chamada.
- Logs estruturados em formato **JSON** para integração com serviços de monitoramento (Cloud Logging/Render).
- Tratamento de erros robusto com logs de severidade `ERROR` e `WARNING`.

### Alterado (API)
- Atualização dos IDs das tabelas de destino para a nova estrutura da **Camada Silver** (`silver_respostas` e `silver_detalhes_respostas`).

## [1.6.0] - 2026-03-11

### Adicionado
- **Camada Gold (Semântica):** Criação da view `gold_auditorias_consolidadas` no BigQuery, aplicando Pivot Condicional para resolver a modelagem EAV da camada Silver, agrupando `resposta_conformidade` e `observacao_texto` na mesma linha.
- **Extrator de Metadados (Python):** Script `scripts/extrai_dicionario_real.py` para converter o `ESTRUTURA_FORMULARIO` do front-end em um Dicionário de Dados plano (`dicionario_oficial.csv`), atuando como *Single Source of Truth* (Docs-as-Code).
- **Documentação de Arquitetura:** Escrita da ADR 0006 justificando a adoção da Camada Gold via Python em vez de manipulação Regex no SQL.
- **(Front-end):**
    - Validação dinâmica no campo de data da avaliação (restrição ao mês atual e anterior).
    - Bloqueio de submissão para datas futuras.
- **(Database):** Nova arquitetura da **Camada Silver** normalizada (Tabelas: `silver_respostas` e `silver_detalhes_respostas`).
- Scripts DDL para criação de tabelas com tipagem forte no BigQuery.
- **Dicionário de Dados** oficial documentando todas as colunas, chaves e metadados.

### Alterado
- **Dicionário de Dados:** A tabela `dim_perguntas` no BigQuery foi substituída. Deixou de usar formatação instável via Regex (`REGEXP_REPLACE`) e passou a consumir diretamente o `dicionario_oficial.csv`, garantindo 100% de fidelidade com as perguntas de negócio da interface.
- **Documentação:** Atualização do `ARCHITECTURE.md` para refletir a topologia ELT (Extract, Load, Transform), separação correta das camadas Bronze, Silver e Gold, e inclusão do diagrama de linhagem de dados (Mermaid.js).
- **(Database):**
    - Refatoração dos scripts de ingestão SQL (MERGE) para suportar o novo modelo EAV.
    - Atualização da `gold_view_consolidada` para realizar o JOIN entre as novas tabelas silver.


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