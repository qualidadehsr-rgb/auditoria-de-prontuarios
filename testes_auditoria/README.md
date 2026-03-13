# Auditoria de Qualidade de Dados (dbt)

Este subprojeto contém a suíte de testes de Qualidade de Dados (Data Quality) para a plataforma de Auditoria de Prontuários, construída utilizando o **dbt (Data Build Tool)**.

## Objetivo
Atuar como um "Auditor Independente" sobre a Camada Prata (`silver`) do nosso Data Warehouse no BigQuery. O objetivo é garantir o padrão de Defesa em Profundidade (Queijo Suíço), barrando dados nulos, duplicados ou valores inválidos que possam ter passado pela API ou por manutenções no banco de dados.

## Estrutura do Contrato de Dados (Data Contract)
Nossos testes não são baseados em scripts complexos, mas sim em regras declarativas.
* **Arquivo Principal:** O contrato de dados reside em `models/schema.yml`.
* **Regras Mapeadas:** Testes de unicidade (`unique`), não-nulos (`not_null`) e valores aceitos (`accepted_values`).
* **Tratamento de Dívida Técnica:** Filtros SQL nativos são utilizados dentro do contrato para isolar e ignorar sujeiras históricas conhecidas (como textos de observação inseridos em campos de resposta múltipla).

## Como executar localmente

1. Certifique-se de que o seu ambiente virtual Python (`venv`) está ativado.
2. Certifique-se de que o arquivo `profiles.yml` (no seu diretório de usuário `.dbt`) está apontando para a sua Service Account do Google Cloud.
3. Entre na pasta do projeto:
   ```bash
   cd testes_auditoria
   ```
4. Rode a suíte de testes:
    ```bash
    dbt test
    ```

