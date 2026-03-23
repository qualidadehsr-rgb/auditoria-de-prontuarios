# Sistema de Auditoria de Prontuários (Data Architecture & App)

Um ecossistema completo (App Web + API + Data Warehouse + BI) construído para resolver o desafio de escalabilidade na auditoria clínica de um grupo hospitalar com 9 unidades, transformando dados qualitativos e quantitativos em inteligência de negócio.

## 1. O Contexto e a Evolução do Problema

A auditoria clínica exige a avaliação minuciosa de mais de 600 itens por prontuário. A evolução deste projeto passou por três fases arquiteturais:

* **Fase 1 (O Caos Manual):** Cada hospital usava uma planilha isolada no Google Sheets que atuava como formulário, banco de dados, motor de cálculo e BI. Consolidar a visão corporativa exigia semanas de trabalho manual, gerando atrasos e alto risco de inconsistência.
* **Fase 2 (O Gargalo Técnico):** Criei uma Aplicação Web para centralizar a coleta. Porém, esbarramos no **"Wide Table Problem"**: cada pergunta virava uma coluna. Chegamos a mais de 600 colunas (perguntas + cálculos). Painéis no Looker Studio sofriam com alta latência (ou quebravam) ao ler centenas de colunas com alta esparsidade (valores nulos), e sofríamos com perda de dados por concorrência simultânea.
* **Fase 3 (A Maturidade):** Redesenho completo para uma **Arquitetura Analítica Moderna (Modern Data Stack)**, separando coleta, armazenamento, transformação e consumo.

## 2. A Solução (Engenharia de Dados)

Para resolver a rigidez estrutural, o pipeline de dados foi reconstruído no **Google BigQuery** utilizando **dbt**:

* **Arquitetura Medalhão:** Separação clara em camadas Bronze (Raw), Silver (Curated) e Gold (Semântica).
* **Modelagem EAV (Verticalização):** Utilização de `UNPIVOT` dinâmico para transformar as mais de 600 colunas horizontais em um modelo relacional vertical limpo e escalável.
* **Métricas FinOps:** Cálculos complexos foram movidos do Looker Studio para o BigQuery, entregando métricas binárias (0 e 1) pré-processadas para o BI.

## 3. O Impacto no Negócio

A nova arquitetura transformou o sistema em uma plataforma **multi-hospital** robusta. Os principais ganhos incluem:

* **Automação Total:** Eliminação de 100% do processo manual de consolidação de planilhas.
* **Escalabilidade Imediata:** A modelagem vertical permite plugar novas unidades hospitalares ou adicionar novas perguntas à auditoria sem necessidade de alterar o schema do banco de dados.
* **Alta Performance Analítica:** Redução drástica no tempo de carregamento dos dashboards corporativos.
* **Fundação para o Futuro:** Dados estruturados, tipados e testados, deixando o ambiente pronto para *Self-Service Analytics*.

## 4. A Solução e Arquitetura

Desenvolvi uma arquitetura moderna orientada a Analytics (OLAP) no **Google BigQuery**. O pipeline implementa a **Arquitetura Medalhão** e adota o paradigma **ELT**, com processamento incremental para otimização de custos (FinOps).

```mermaid
graph TD
    subgraph "1. Fontes de Dados"
        A[App Web / Formulário]
        B[Planilhas Legadas / Sheets]
    end

    subgraph "2. Ingestão ELT"
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
    C -->|Carga JSON Bruto| F
    D -->|Carga Histórica| E
    D -->|Carga Histórica| F
    
    E -->|dbt: Extração e Tipagem| G
    F -->|Tipagem e Deduplicação| H
    
    G -->|JOIN Cabeçalho| J
    H -->|Pivot + Lógica Binária| J
    I -->|"Tradução Labels (LEFT JOIN)"| J
    
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

## 5. Destaques da Engenharia (Ponta a Ponta)
1. **Garantia de Integridade e Idempotência**: Geração de **UUIDv4** na origem e uso de comandos `MERGE` garantem que reprocessar o pipeline não gere duplicidade.
2. **Efeito Espelho e Modelagem EAV (Verticalização)**: Padronização de origens extremas na camada Staging. De um lado, a extração dinâmica de arrays JSON (Web); do outro, o `UNPIVOT` de mais de 600 colunas (Legado). Ambas as fontes são forçadas para o mesmo formato vertical de chave-valor (ID, Pergunta, Resposta), garantindo que o banco cresça em linhas e permita novos formulários sem alterar o schema do banco.
3. **Métricas Binárias (Estratégia FinOps)**: Implementação de lógica $0$ e $1$ (`qtde_conforme` e `qtde_valida`) diretamente no SQL. Isso elimina cálculos pesados de texto no Looker Studio, reduzindo a latência e o custo de processamento (ADR 0014).
4. **Docs-as-Code (SSOT)**: Extração automatizada de metadados do Front-end via Python (AST), garantindo que o BI exiba exatamente o que o médico vê no formulário.
5. **Data Quality & Contratos (dbt)**: Implementação do dbt para orquestrar a extração tipada de campos complexos (JSON), garantindo que o dado chegue limpo e materializado para a camada analítica. O uso de testes automatizados assegura a integridade das chaves primárias e campos obrigatórios antes do consumo no BI.
6. **Privacy by Design (LGPD)**: Mascaramento dinâmico via Regex (`[CENSURADO]`) na Camada Gold para proteger dados sensíveis inseridos em campos de texto livre.
7. **Segurança e Privilégio Mínimo**: Implementação de política de IAM com Service Accounts dedicadas e restritas para o consumo do Looker Studio (ADR 0013).
8. **Observabilidade**: API Node.js com logs estruturados em JSON e `request_id` para rastreio total do ciclo de vida do dado.

## 6. Métricas de Impacto e Valor

* **Escala Histórica:** Ingestão de **104.820 linhas** legadas padronizadas sob o modelo EAV.
* **Performance Analítica:** Redução no tempo de carregamento do Dashboard de ~40s (Sheets) para **< 3s** (BigQuery).
* **FinOps:** Economia de processamento ao evitar leitura de colunas nulas e simplificar agregações no BI.

## 7. Tecnologias Utilizadas
- **Data Engineering**: Python 3.11 (Polars, AST), dbt, SQL Analítico (BigQuery).
- **Software Engineering**: Node.js, Express.js, HTML5/JS Vanilla.
- **Orquestração & CI/CD**: GitHub Actions, Gitflow.
- **Data Visualization**: Looker Studio.
- **Armazenamento de Dados:** Google BigQuery (Data Warehouse).
- **Transformação de Dados (ETL/ELT):** dbt (Data Build Tool) via dbt Cloud.
- **Versionamento:** Git e GitHub.

## 8. Documentação e Decisões
Este projeto utiliza **ADRs** para rastreabilidade técnica. Consulte a pasta `docs/adr/`. Veja também o [Guia de Contribuição](./CONTRIBUTING.md).

## 9. Próximos Passos (Engineering Roadmap)

### Infraestrutura e Governança (CONCLUÍDO)
- [x] **Modelagem Silver EAV:** Normalização completa das tabelas.
- [x] **Data Quality (dbt):** Testes de integridade automatizados.
- [x] **Data Masking (LGPD):** Mascaramento de dados sensíveis.
- [x] **Métricas FinOps:** Lógica binária 0/1 implementada no DW.
- [x] **Security (IAM):** Conta de serviço com privilégio mínimo para o BI.
### Fase 1: Fundação (Setup & Conexão) [CONCLUÍDO]
- [x] Criar conta no dbt Cloud.
- [x] Conectar dbt ao GitHub e ao BigQuery via Service Account.
- [x] Resolver travas de Billing/Sandbox no Google Cloud.
### Fase 2: O Ponto de Partida (Sources & Bronze) [CONCLUÍDO]
- [x] Configurar `sources.yml` para mapear os dados brutos.
- [x] Validar leitura das tabelas `bronze_respostas_web` e `bronze_legado_respostas`.
### Fase 3: Padronização Bronze/Staging e Início da Silver [EM ANDAMENTO]
- [x] Modelo SQL para extração e tipagem do JSON da Web (`stg_bronze_detalhes_respostas_web` e capa).
- [x] Modelo SQL com `UNPIVOT` dinâmico para as 600+ colunas do legado (`stg_bronze_detalhes_respostas_legado` e capa).
- [ ] Consolidação via `UNION ALL` nas tabelas finais `silver_respostas` e `silver_detalhes`.
## Fase 4: Controle de Qualidade (Testes) [PENDENTE]
- [ ] Configurar testes de unicidade e nulidade no `schema.yml`.
- [ ] Validar integridade dos UUIDs gerados.
## Fase 5: Entrega de Valor (Gold) [PENDENTE]
- [ ] Migrar `gold_auditorias_consolidadas` para o dbt.
- [ ] Aplicar lógica binária (0/1) e JOIN com dicionário de perguntas.
### Fase 6: Automação (Jobs e Deploy) [PENDENTE]
- [ ] Agendar Jobs de execução automática no dbt Cloud.
## Fase 7: Desacoplamento da API (Opcional) [PENDENTE]
- [ ] Simplificar `index.js` para salvar apenas o JSON bruto, delegando o processamento 100% ao dbt.

---
### Desenvolvido por:
**Ediney Magalhães**
#### *Analytics Engineer / Data Engineer / Estatístico*
