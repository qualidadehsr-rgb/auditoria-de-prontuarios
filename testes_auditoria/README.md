# Transformação e Qualidade de Dados (dbt)

Este subprojeto contém o pipeline de transformação (ELT) e a suíte de testes de Qualidade de Dados para a plataforma de Auditoria de Prontuários, construída utilizando o **dbt (Data Build Tool)** via dbt Cloud.

## Objetivo
Atuar como o motor central de processamento de regras de negócio e "Auditor Independente" do Data Warehouse no BigQuery. Com a adoção da arquitetura de **Ingestão Pura**, o dbt é responsável por:
1. **Extração e Parsing:** Desempacotar dados de formulários que chegam em formato JSON (`conteudo_bruto`) na camada Bronze.
2. **Transformação (Staging para Silver):** Padronizar e tipar dados oriundos de sistemas web e planilhas legadas.
3. **Garantia ACID:** Barrar dados nulos, duplicados ou valores inválidos logo na entrada (Staging), garantindo que a camada Silver receba apenas dados consistentes.
4. **Agregação (Gold):** Materializar métricas de conformidade para alta performance de BI.

## Estrutura de Modelos e Contratos de Dados
Nossas transformações e testes são baseados em SQL modular e regras declarativas (YAML).
* **Camada de Staging (`models/bronze/`):** Modelos como `stg_bronze_respostas_web.sql` que extraem os campos do JSON e padronizam nomenclaturas.
* **Arquivo de Contrato (`schema.yml`):** Define as expectativas dos dados. 
* **Regras Mapeadas:** Testes rigorosos de unicidade (`unique`) e não-nulidade (`not_null`) em chaves primárias (ex: UUIDs gerados na origem) e campos extraídos.

## Como executar

O ambiente oficial de desenvolvimento e orquestração deste projeto é o **dbt Cloud** (conforme ADR 0016).

Para rodar todo o pipeline (construção das tabelas e execução dos testes de contrato) no ambiente de desenvolvimento do dbt Cloud:

1. Abra o IDE do dbt Cloud na sua branch de trabalho.
2. Na barra de comandos inferior, execute:
   ```bash
   dbt build
   ```
(Nota: O comando `dbt build` executa o `dbt run` e o `dbt test` em sequência, garantindo que os modelos só sejam materializados se passarem nos testes do contrato).

