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