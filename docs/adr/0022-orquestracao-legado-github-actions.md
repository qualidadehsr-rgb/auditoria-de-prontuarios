# ADR 0022: Orquestração do Pipeline Legado via GitHub Actions

## Contexto
O hospital possui um volume significativo de dados históricos e contínuos sendo inseridos via formulário legado (Google Sheets). Necessitava de uma solução para extrair esses dados de forma autônoma e enviá-los para a Camada Bronze do BigQuery, sem depender de execução manual ou infraestrutura complexa e custosa (ex: Apache Airflow ou Cloud Composer).

## Decisão
Optei por utilizar o **GitHub Actions** para orquestrar o pipeline de dados legado (`scripts/extrai_dados_antigos.py`).
* Configurei um *workflow* (`.github/workflows/`) com gatilhos baseados em `cron` para rodar em horários estratégicos.
* O GitHub Actions provisiona um *runner* efêmero, instala as dependências do Python e executa o script, morrendo logo em seguida (Serverless).

## Consequências
* **Positivas:** Custo zero de infraestrutura (aproveitando os minutos gratuitos do GitHub). Não há necessidade de manter servidores ligados 24/7. Automação completa do fluxo híbrido de dados.
* **Negativas:** Limite de tempo de execução do GitHub Actions (embora os scripts atuais rodem em poucos segundos, grandes volumes no futuro poderiam exigir paginação avançada).

* **Critérios adicionais da escolha:**
  * Python é a linguagem padrão para engenharia de dados, facilitando contratação e manutenção
  * Polars oferece performance superior ao Pandas para manipulação de dados em memória
  * GitHub Actions é gratuito para repositórios públicos (2000 min/mês para privados), eliminando custos de orquestração
  * Dispensa servidor dedicado (ex: VM com Airflow), reduzindo complexidade operacional e custo de infraestrutura
  * Projeto não possui DAGs complexas que justifiquem Airflow — GitHub Actions resolve cron simples com zero infraestrutura adicional
  * Se o projeto evoluir para DAGs complexas com dependências entre pipelines, a migração natural é para Airflow ou Cloud Composer, já documentada como caminho de evolução