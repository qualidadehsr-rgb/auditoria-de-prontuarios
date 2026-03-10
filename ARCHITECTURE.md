# Arquitetura do Sistema de Auditoria de Prontuários

Este documento fornece a visão geral de alto nível dos componentes do sistema, seus fluxos de dados e a infraestrutura tecnológica que suporta a operação de auditoria e análise de negócios.

## 1. Visão Geral do Sistema

O ecossistema foi desenhado para resolver o problema de colunas excessivas (Wide Table Problem) e concorrência de acessos, dividindo a responsabilidade em duas frentes de ingestão de dados que convergem para um Data Warehouse central (OLAP).

O sistema opera sob as seguintes camadas:
- **Client (Apresentação):** Aplicação web otimizada.
- **Ingestion API (Node.js):** Backend Node.js responsável pelas novas auditorias, operando com ingestão *near-real-time*.
- **Data Pipeline (ETL):** Automação em Python responsável pela ingestão em lote (batch) de dados legados.
- **Data Warehouse:** Armazenamento analítico estruturado no Google BigQuery.
- **Business Intelligence:** Camada de visualização e relatórios operando sobre views materializadas/dinâmicas.

---

## 2. Componentes e Tecnologias

### 2.1. Ingestão Near-Real-Time (API Node.js)
Responsável por captar os dados preenchidos ativamente pelos auditores no sistema, eliminando a dependência de um banco de dados transacional (OLTP) tradicional no meio do caminho.
* **Front-End:** Renderização estática (HTML/JS Vanilla) servida via Express. Gerencia o estado do formulário e faz requisições RESTful.
* **API Middleware:** Realiza sanitização e o *Unpivot* do payload JSON para o padrão EAV (Entity-Attribute-Value).
* **Concorrência e Integridade:** Geração de **UUIDv4** para cada auditoria na origem e relacionamento *header/detail*. Isso garante integridade e permite estratégias de deduplicação (Idempotência via `MERGE`) na camada Silver, eliminando perdas por concorrência de acessos simultâneos.
* **Conexão de Banco:** Utiliza a BigQuery Streaming API para reduzir a latência de disponibilidade analítica. Possui padrão "Fail Fast" na inicialização para garantir a presença das variáveis de ambiente.

### 2.2. Ingestão em Lote (Data Engineering / ETL)
Responsável por garantir a preservação histórica e sincronização de dados lançados via planilhas legadas.
* **Extrator (Python):** Script de orquestração rodando de forma isolada (`etl/extracao_sheets.py`).
* **Processamento (Polars):** Utilizado para manipulação de matrizes de dados na memória RAM (virtualização via `BytesIO`), garantindo conversão de tipos (Schema Enforcement) e preenchimento de nulos (Shape Errors).
* **Orquestração (GitHub Actions):** Pipeline de CI/CD configurado para rodar em fuso horário específico (06h, 12h e 18h) acionando servidores Linux temporários (Ubuntu).

### 2.3. Data Warehouse & BI
* **Armazenamento (Google BigQuery):** Repositório centralizado operando sob a Arquitetura Medalhão.
  * *Camada Bronze:* Dados brutos sem tratamento (`bronze_legado_respostas`).
  * *Camada Silver/Gold:* Dados relacionais estruturados e tipados (`respostas`, `detalhes_respostas`).
* **Visualização (Looker Studio):** Consumo no Looker realizado através de **Views de Consumo/Transformação** no BigQuery. Essas views expõem as métricas agrupadas e calculadas, permitindo que o Looker consuma a estrutura EAV nativamente, sem exigir que o usuário final ou a ferramenta de BI realizem operações custosas de *pivot* manual.

---

## 3. Registros de Decisões Arquiteturais (ADRs)

Todas as mudanças estruturais, trade-offs e decisões técnicas tomadas ao longo do projeto estão documentadas individualmente. 

Para entender o contexto de "por que" certas tecnologias ou padrões foram escolhidos, consulte a pasta [`docs/adr/`](./docs/adr/):

* [ADR 0001: Migração do Armazenamento (Sheets para BigQuery)](./docs/adr/0001-migracao-bigquery.md)
* [ADR 0002: Modelagem de Dados Vertical (Padrão EAV)](./docs/adr/0002-modelagem-eav.md)
* [ADR 0003: Inicialização da Aplicação com Padrão "Fail Fast"](./docs/adr/0003-fail-fast.md)
* [ADR 0004: Adoção da Arquitetura Medalhão e Ingestão com Python](./docs/adr/0004-arquitetura-medalhao-etl.md)
* [ADR 0005: Modelagem EAV para superação do 'Wide Table Problem' no Legado](./docs/adr/0005-modelagem-eav-para-dados-legados.md)