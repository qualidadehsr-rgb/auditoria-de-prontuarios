# Arquitetura do Sistema de Auditoria de Prontuários

Este documento fornece a visão geral de alto nível dos componentes do sistema, seus fluxos de dados e a infraestrutura tecnológica que suporta a operação de auditoria e análise de negócios.

## 1. Visão Geral do Sistema

O ecossistema foi desenhado para resolver o problema de colunas excessivas (Wide Table Problem) e concorrência de acessos, dividindo a responsabilidade em duas frentes de ingestão de dados que convergem para um Data Warehouse central (OLAP).

O sistema opera sob as seguintes camadas:
- **Client (Apresentação):** Aplicação web otimizada.
- **Ingestion API (Node.js):** Backend Node.js responsável pelas novas auditorias, operando com ingestão *near-real-time*.
- **Data Pipeline (ELT):** Automação em Python responsável pela ingestão em lote (batch) de dados legados.
- **Data Warehouse:** Armazenamento analítico estruturado no Google BigQuery sob a Arquitetura Medalhão.
- **Business Intelligence:** Camada de visualização (Looker Studio) operando sobre métricas binárias pré-calculadas.

---

## 1.1. Diagrama de Arquitetura e Linhagem (Data Lineage)

```mermaid
graph TD
    subgraph "1. Fontes de Dados"
        A[App Web / Formulário]
        B[Planilhas Legadas / Sheets]
    end

    subgraph "2. Ingestão"
        C[API Node.js]
        D[Pipeline Python / GitHub Actions]
    end

    subgraph "3. Camada Bronze (Raw Data)"
        E[(respostas_brutas)]
        F[(detalhes_respostas_brutas)]
    end

    subgraph "4. Camada Silver (Curated / EAV)"
        G[(silver_respostas)]
        H[(silver_detalhes_respostas)]
    end

    subgraph "5. Camada Gold (Semântica / FinOps)"
        I[(dim_perguntas - Dicionário CSV)]
        J{{gold_auditorias_consolidadas - View <br/> Métricas Binárias 0/1}}
    end

    subgraph "6. Consumo (BI)"
        K[Looker Studio / Dashboards]
    end

    %% Relacionamentos e Fluxos
    A -->|Near-Real-Time / JSON| C
    B -->|Carga Batch| D
    
    C -->|Idempotência / Merge| E
    C -->|Unpivot / Merge| F
    D -->|Carga Histórica| E
    D -->|Carga Histórica| F
    
    E -->|Tipagem e Deduplicação| G
    F -->|Tipagem e Deduplicação| H
    
    G -->|JOIN Cabeçalho| J
    H -->|Pivot + Lógica Binária| J
    I -->|Tradução Labels (LEFT JOIN)| J
    
    J -->|Somas Simples / Alta Performance| K

    %% Estilização do Diagrama
    classDef bronze fill:#CD7F32,stroke:#333,stroke-width:2px,color:#fff;
    classDef silver fill:#C0C0C0,stroke:#333,stroke-width:2px,color:#000;
    classDef gold fill:#FFD700,stroke:#333,stroke-width:2px,color:#000;
    classDef view fill:#f9f,stroke:#333,stroke-width:2px;
    
    class E,F bronze;
    class G,H silver;
    class I gold;
    class J view;
```
---

## 2. Componentes e Tecnologias

### 2.1. Ingestão Near-Real-Time (API Node.js)
Responsável por captar os dados preenchidos ativamente pelos auditores, eliminando a dependência de uma base de dados transacional (OLTP). Gera **UUIDv4** na origem para garantir a integridade e permitir estratégias de deduplicação via `MERGE`.

### 2.2. Ingestão em Lote (Data Engineering / ELT)
Responsável por garantir a preservação histórica de dados legados. Utiliza **Python (Polars)** para manipulação de matrizes de dados em memória e orquestração via **GitHub Actions** em horários programados.

### 2.3. Data Warehouse & BI (Estratégia FinOps)
* **Armazenamento (Google BigQuery):** Repositório centralizado operando sob a **Arquitetura Medalhão**.
* **Camada Gold:** Além de resolver o padrão EAV, esta camada implementa a **Lógica Binária de Agregação**. 
* **Otimização de Performance:** Movemos a complexidade de cálculo (transformar "Conforme" em número) do Looker Studio para o BigQuery. Isso garante que o dashboard realize apenas operações de `SUM`, reduzindo o tempo de resposta e o custo de processamento.

---

## 3. Registos de Decisões Arquiteturais (ADRs)

* [ADR 0001: Migração do Armazenamento (Sheets para BigQuery)](./docs/adr/0001-migracao-bigquery.md)
* [ADR 0002: Modelagem de Dados Vertical (Padrão EAV)](./docs/adr/0002-modelagem-eav.md)
* [ADR 0003: Inicialização da Aplicação com Padrão "Fail Fast"](./docs/adr/0003-fail-fast.md)
* [ADR 0004: Adoção da Arquitetura Medalhão e Ingestão com Python](./docs/adr/0004-arquitetura-medalhao-etl.md)
* [ADR 0005: Modelagem EAV para superação do 'Wide Table Problem' no Legado](./docs/adr/0005-modelagem-eav-para-dados-legados.md)
* [ADR 0006: Implementação da Camada Gold e Dicionário de Metadados via Python](./docs/adr/0006-camada-gold-e-dicionario-metadados.md)
* [ADR 0007: Implementação de Observabilidade e Logs Estruturados](./docs/adr/0007-observabilidade-logs-estruturados.md)
* [ADR 0008: Refatoração da Camada Silver para Modelo EAV Normalizado](./docs/adr/0008-refatoracao-camada-silver-eav.md)
* [ADR 0009: Validação Dinâmica de Datas no Front-end](./docs/adr/0009-validacao-dinamica-datas-frontend.md)
* [ADR 0010: Validação de Contrato (Schema Validation) Nativa na API](./docs/adr/0010-validacao-contrato-backend.md)
* [ADR 0011: Mascaramento Dinâmico de Dados Sensíveis (LGPD)](./docs/adr/0011-mascaramento-dados-sensiveis.md)
* [ADR 0012: Adoção do dbt para Auditoria e Qualidade de Dados](./docs/adr/0012-adocao-dbt-qualidade.md)
* [ADR 0013: IAM e Política de Privilégio Mínimo para Consumo de BI](./docs/adr/0013-iam-bi-least-privilege.md)
* [ADR 0014: Implementação de Lógica Binária para Métricas de Conformidade](./docs/adr/0014-logica-binaria-conformidade.md)