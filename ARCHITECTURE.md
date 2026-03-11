# Arquitetura do Sistema de Auditoria de Prontuários

Este documento fornece a visão geral de alto nível dos componentes do sistema, seus fluxos de dados e a infraestrutura tecnológica que suporta a operação de auditoria e análise de negócios.

## 1. Visão Geral do Sistema

O ecossistema foi desenhado para resolver o problema de colunas excessivas (Wide Table Problem) e concorrência de acessos, dividindo a responsabilidade em duas frentes de ingestão de dados que convergem para um Data Warehouse central (OLAP).

O sistema opera sob as seguintes camadas:
- **Client (Apresentação):** Aplicação web otimizada.
- **Ingestion API (Node.js):** Backend Node.js responsável pelas novas auditorias, operando com ingestão *near-real-time*.
- **Data Pipeline (ELT):** Automação em Python responsável pela ingestão em lote (batch) de dados legados, com as transformações analíticas (Pivot/JOINs) ocorrendo dentro do Data Warehouse.
- **Data Warehouse:** Armazenamento analítico estruturado no Google BigQuery sob a Arquitetura Medalhão.
- **Business Intelligence:** Camada de visualização e relatórios operando sobre views materializadas/dinâmicas.

---

## 1.1. Diagrama de Arquitetura e Linhagem (Data Lineage)

O fluxo abaixo ilustra a jornada do dado desde a captação até à visualização no Looker Studio, respeitando o isolamento de camadas:

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
        G[(respostas)]
        H[(detalhes_respostas)]
    end

    subgraph "5. Camada Gold (Semântica / SSOT)"
        I[(dim_perguntas - Dicionário CSV)]
        J{{gold_auditorias_consolidadas - View}}
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
    H -->|Pivot Condicional| J
    I -->|Tradução Labels (LEFT JOIN)| J
    
    J -->|Leitura Direta Analítica| K

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
Responsável por captar os dados preenchidos ativamente pelos auditores no sistema, eliminando a dependência de uma base de dados transacional (OLTP) tradicional no meio do caminho.
* **Front-End:** Renderização estática (HTML/JS Vanilla) servida via Express. Gere o estado do formulário e faz pedidos RESTful.
* **API Middleware:** Realiza a sanitização e o *Unpivot* do payload JSON para o padrão EAV (Entity-Attribute-Value).
* **Concorrência e Integridade:** Geração de **UUIDv4** para cada auditoria na origem e relacionamento *header/detail*. Isso garante a integridade e permite estratégias de deduplicação (Idempotência via `MERGE`) na camada Silver, eliminando perdas por concorrência de acessos simultâneos.
* **Conexão de Banco:** Utiliza a BigQuery Streaming API para reduzir a latência de disponibilidade analítica. Possui o padrão "Fail Fast" na inicialização para garantir a presença das variáveis de ambiente.

### 2.2. Ingestão em Lote (Data Engineering / ELT)
Responsável por garantir a preservação histórica e a sincronização de dados lançados via folhas de cálculo legadas.
* **Extrator (Python):** Script de orquestração a correr de forma isolada (`etl/extracao_sheets.py`).
* **Processamento (Polars):** Utilizado para manipulação de matrizes de dados na memória RAM (virtualização via `BytesIO`), garantindo conversão de tipos (Schema Enforcement) e preenchimento de nulos (Shape Errors).
* **Orquestração (GitHub Actions):** Pipeline de CI/CD configurado para correr num fuso horário específico (06h, 12h e 18h) acionando servidores Linux temporários (Ubuntu).

### 2.3. Data Warehouse & BI
* **Armazenamento (Google BigQuery):** Repositório centralizado a operar estritamente sob a **Arquitetura Medalhão**:
  * *Camada Bronze:* Dados brutos sem tratamento (Data Lakehouse). Serve como histórico imutável.
  * *Camada Silver:* Dados relacionais estruturados e tipados (`respostas`, `detalhes_respostas`). Utiliza modelagem EAV para lidar com a natureza mutável do formulário.
  * *Camada Gold:* Camada semântica otimizada para o negócio. Possui o Dicionário de Dados (`dim_perguntas`) gerado via script Python como *Single Source of Truth* (SSOT) e a View `gold_auditorias_consolidadas` que resolve o padrão EAV através de um Pivot Condicional.
* **Visualização (Looker Studio):** Consumo no Looker realizado através da Camada Gold. Este desacoplamento permite que a ferramenta de BI consuma textos amigáveis nativamente, sem exigir que o utilizador final ou o analista realize operações dispendiosas de *pivot* manual ou tratamento de strings no front-end.

---

## 3. Registos de Decisões Arquiteturais (ADRs)

Todas as mudanças estruturais, trade-offs e decisões técnicas tomadas ao longo do projeto estão documentadas individualmente. 

Para entender o contexto de "por que" certas tecnologias ou padrões foram escolhidos, consulte a pasta [`docs/adr/`](./docs/adr/):

* [ADR 0001: Migração do Armazenamento (Sheets para BigQuery)](./docs/adr/0001-migracao-bigquery.md)
* [ADR 0002: Modelagem de Dados Vertical (Padrão EAV)](./docs/adr/0002-modelagem-eav.md)
* [ADR 0003: Inicialização da Aplicação com Padrão "Fail Fast"](./docs/adr/0003-fail-fast.md)
* [ADR 0004: Adoção da Arquitetura Medalhão e Ingestão com Python](./docs/adr/0004-arquitetura-medalhao-etl.md)
* [ADR 0005: Modelagem EAV para superação do 'Wide Table Problem' no Legado](./docs/adr/0005-modelagem-eav-para-dados-legados.md)
* [ADR 0006: Implementação da Camada Gold e Dicionário de Metadados via Python](./docs/adr/0006-camada-gold-e-dicionario-metadados.md)