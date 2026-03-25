# ADR 0012: Adoção do dbt para Testes de Qualidade de Dados (Data Quality)

## Status
Aceito

## Data
13 de Março de 2026

## Contexto e Problema
A nossa API Node.js já possui validação de schema (Fail Fast) para garantir que novos dados inseridos pelo formulário estejam corretos. No entanto, aplicando o modelo de segurança "Defesa em Profundidade" (Queijo Suíço), identificamos que a API atua apenas como a "porta da frente". 
Dados históricos migrados (via Google Sheets), intervenções manuais diretas no banco de dados ou futuras manutenções poderiam introduzir dados nulos, chaves primárias duplicadas ou valores fora do padrão na nossa Camada Silver, comprometendo a confiabilidade dos dashboards na Camada Gold.

## Decisão Arquitetural
Decidimos implementar o **dbt (Data Build Tool)**, especificamente os pacotes `dbt-core` e `dbt-bigquery`, para atuar como o nosso "Auditor Independente" de Qualidade de Dados.

1. **Data Contracts (Contratos de Dados):** Utilizamos arquivos declarativos `.yml` na pasta `models` para definir regras estritas de negócio (ex: testes `not_null`, `unique` e `accepted_values`).
2. **Atuação na Camada Prata:** O dbt foi configurado para varrer as tabelas da Camada Prata (`silver_respostas` e `silver_detalhes_respostas`), garantindo que a sujeira seja barrada antes de chegar às views analíticas (Gold).
3. **Tratamento de Dívida Técnica:** Filtros SQL (`WHERE`) foram incorporados aos testes YAML para isolar sujeiras históricas mapeadas (ex: textos de observação lançados em colunas de respostas curtas), criando uma "linha de base" segura.

## Consequências

### Positivas:
* **Confiabilidade Matemática:** A qualidade do dado deixa de ser uma presunção e passa a ser validada de forma automatizada.
* **Mapeamento de Dívida:** O rigor do dbt ajudou a identificar anomalias nos dados legados, permitindo correções direcionadas no futuro.
* **Documentação Viva:** O arquivo `schema.yml` serve como uma documentação sempre atualizada de como o dado deve se comportar.

### Negativas/Atenção:
* Adiciona uma nova ferramenta e um ambiente virtual Python (`venv`) à stack do projeto, aumentando levemente a curva de aprendizado para novos desenvolvedores.
* Necessidade de rodar comandos adicionais (`dbt test`) durante o fluxo de desenvolvimento contínuo (CI/CD).

* **Critérios adicionais da escolha:**
  * Padrão de mercado para analytics engineering no modelo ELT
  * Testes de qualidade nativos (unique, not_null, relationships, accepted_values) sem código extra
  * Materialização automática (table, view, incremental) sem necessidade de escrever DDL manualmente
  * Cada modelo é um arquivo .sql versionado no Git, garantindo rastreabilidade total
  * dbt Cloud oferece free tier para 1 desenvolvedor, viabilizando uso sem custo