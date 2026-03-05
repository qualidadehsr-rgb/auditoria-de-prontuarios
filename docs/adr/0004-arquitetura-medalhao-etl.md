# ADR 004: Adoção da Arquitetura Medalhão e Ingestão em Lote com Python/Polars

* **Data:** Março de 2026
* **Status:** Aceito e Implementado
* **Contexto:** O sistema possuía milhares de registros legados no Google Sheets. A API em Node.js foi desenhada para ingestão transacional e em tempo real (unpivot de formulários novos), não sendo a ferramenta adequada para processar o histórico em lote, que continha matrizes irregulares e linhas em branco.
* **Decisão:** Adotar os princípios da Arquitetura Medalhão (Medallion Architecture) no BigQuery e construir um pipeline ETL isolado utilizando Python e Polars. O script fará a extração bruta do legado e salvará de forma imutável em uma camada "Bronze" (`bronze_legado_respostas`).
* **Consequências (Trade-offs):**
  * *Positivo:* Desacoplamento total entre o sistema transacional (Node.js) e o fluxo de engenharia de dados (Python). O Polars permitiu resolver os `ShapeErrors` (linhas irregulares do Sheets) em tempo de execução na memória RAM (`BytesIO`) de forma extremamente veloz. A camada Bronze garante uma cópia fiel e auditável do passado.
  * *Negativo:* O repositório torna-se poliglota (JavaScript e Python), exigindo que a equipe mantenha e gerencie dois ecossistemas de dependências distintos (`package.json` e `requirements.txt`).