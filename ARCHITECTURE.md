# Arquitetura do Sistema de Auditoria de Prontuários

Este documento fornece a visão geral de alto nível dos componentes do sistema, seus fluxos de dados e a infraestrutura tecnológica que suporta a operação de auditoria e análise de negócios.



## 1. Visão Geral do Sistema

O ecossistema foi desenhado para resolver o problema de colunas excessivas (Wide Table Problem) e concorrência de acessos, dividindo a responsabilidade em duas frentes de ingestão de dados que convergem para um Data Warehouse central.

O sistema opera sob as seguintes camadas:
- **Client (Apresentação):** Aplicação web otimizada.
- **Transactional Server (API):** Backend Node.js responsável pelas novas auditorias em tempo real.
- **Data Pipeline (ETL):** Automação em Python responsável pela ingestão em lote de dados legados.
- **Data Warehouse:** Armazenamento analítico no Google BigQuery.
- **Business Intelligence:** Camada de visualização e relatórios.

---

## 2. Componentes e Tecnologias

### 2.1. Ingestão em Tempo Real (Transacional)
Responsável por captar os dados preenchidos ativamente pelos auditores no sistema.
* **Front-End:** Renderização estática (HTML/JS Vanilla) servida via Express. Gerencia o estado do formulário e faz requisições RESTful.
* **API (Node.js / Express):** Atua como middleware. Realiza sanitização, gera identificadores únicos (UUIDv4) e executa o *Unpivot* do payload JSON para o padrão EAV (Entity-Attribute-Value).
* **Conexão de Banco:** Utiliza a BigQuery Streaming API para inserção imediata e assíncrona. Possui padrão "Fail Fast" na inicialização.

### 2.2. Ingestão em Lote (Data Engineering / ETL)
Responsável por garantir a preservação histórica e sincronização de dados lançados via planilhas legadas.
* **Extrator (Python):** Script de orquestração rodando de forma isolada (`etl/extracao_sheets.py`).
* **Processamento (Polars):** Utilizado para manipulação de matrizes de dados na memória RAM (virtualização via `BytesIO`), garantindo conversão de tipos (Schema Enforcement) e preenchimento de nulos (Shape Errors).
* **Orquestração (GitHub Actions):** Pipeline de CI/CD configurado para rodar em fuso horário específico (06h, 12h e 18h) acionando servidores Linux temporários (Ubuntu).

### 2.3. Data Warehouse & BI
* **Armazenamento (Google BigQuery):** Repositório centralizado.
  * *Camada Bronze:* Dados brutos (`bronze_legado_respostas`).
  * *Camada Silver/Gold:* Dados relacionais estruturados (`respostas`, `detalhes_respostas`).
* **Visualização (Looker Studio):** Dashboards conectados nativamente ao BigQuery, operando sem latência analítica.

---

## 3. Registros de Decisões Arquiteturais (ADRs)

Todas as mudanças estruturais, trade-offs e decisões técnicas tomadas ao longo do projeto estão documentadas individualmente. 

Para entender o contexto de "por que" certas tecnologias ou padrões foram escolhidos, consulte a pasta [`docs/adr/`](./docs/adr/):

* [ADR 0001: Migração do Armazenamento (Sheets para BigQuery)](./docs/adr/0001-migracao-bigquery.md)
* [ADR 0002: Modelagem de Dados Vertical (Padrão EAV)](./docs/adr/0002-modelagem-eav.md)
* [ADR 0003: Inicialização da Aplicação com Padrão "Fail Fast"](./docs/adr/0003-fail-fast.md)
* [ADR 0004: Adoção da Arquitetura Medalhão e Ingestão com Python](./docs/adr/0004-arquitetura-medalhao-etl.md)