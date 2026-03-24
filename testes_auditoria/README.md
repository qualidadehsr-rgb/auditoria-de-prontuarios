# Transformação e Qualidade de Dados (dbt)

Este subprojeto contém o pipeline de transformação (ELT) e a suíte de testes de Qualidade de Dados para a plataforma de Auditoria de Prontuários, construída utilizando o **dbt (Data Build Tool)** via dbt Cloud.

## Objetivo
Atuar como o motor central de processamento de regras de negócio e "Auditor Independente" do Data Warehouse no BigQuery. Com a adoção da arquitetura de **Ingestão Pura**, o dbt é responsável por:
1. **Extração e Parsing:** Desempacotar dados de formulários que chegam em formato JSON (`conteudo_bruto`) na camada Bronze.
2. **Transformação (Staging para Silver):** Padronizar e tipar dados oriundos de sistemas web e planilhas legadas.
3. **Garantia ACID:** Barrar dados nulos, duplicados ou valores inválidos logo na entrada (Staging), garantindo que a camada Silver receba apenas dados consistentes.
4. **Agregação (Gold) e FinOps:** Materializar métricas de conformidade (`qtde_conforme`, `qtde_valida`) no banco de dados, aliviando o processamento do Looker Studio e garantindo alta performance de BI com menor custo.
5. **Unificação Híbrida de Dados:** Atuar como a ponte definitiva que une o pipeline em lote (Google Sheets/Legado) e o pipeline em tempo real (API Web), consolidando duas estruturas de dados completamente diferentes em uma única "Single Source of Truth".

## Arquitetura Medalhão e Contratos de Dados
Nossas transformações são baseadas em SQL modular, macros e regras declarativas (YAML), divididas nas seguintes camadas:

* **Camada Bronze / Staging (`models/bronze/`):** * Responsável pela extração bruta. Modelos web (`stg_bronze_detalhes_respostas_web`) fazem o parsing de JSON dinâmico. Modelos legados utilizam o pacote `dbt_utils` para realizar o *Unpivot* horizontal para vertical (EAV).
* **Camada Silver (`models/silver/`):** * Onde a mágica da unificação acontece (`silver_respostas` e `silver_detalhes`). Tipagem forte, tratamento de nulos e geração de **Surrogate Keys** (chaves MD5) para garantir unicidade e integridade entre os sistemas distintos.
* **Camada Gold (`models/gold/`):** * O produto final de dados. A tabela `gold_auditorias_consolidadas` aplica pivotagem condicional e mascara dados sensíveis (LGPD), entregando uma tabela plana, otimizada e pronta para o consumo exclusivo do Looker Studio.
* **Contratos de Dados (`schema.yml`):** * Cada camada possui seu próprio contrato. Testes rigorosos de unicidade (`unique`) e não-nulidade (`not_null`) garantem que falhas na origem não poluam o Data Warehouse.

## Como executar

O ambiente oficial de desenvolvimento e orquestração deste projeto é o **dbt Cloud** (conforme ADR 0016).

Para rodar todo o pipeline (construção das tabelas e execução dos testes de contrato) no ambiente de desenvolvimento do dbt Cloud:

Para rodar todo o pipeline no ambiente de desenvolvimento:

1. Abra o IDE do dbt Cloud na sua branch de trabalho (ou o terminal no VS Code).
2. Baixe as dependências do projeto (obrigatório para macros como o `dbt_utils`):
   ```bash
   dbt deps
   ```
3. Na barra de comandos, execute a construção e os testes:
   ```bash
   dbt build
   ```
(Nota: O comando `dbt build` executa o `dbt run` e o `dbt test` em sequência, garantindo que os modelos só sejam materializados se passarem nos testes do contrato).

