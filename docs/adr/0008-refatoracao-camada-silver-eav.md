# ADR 0008: Refatoração da Camada Silver para Modelo EAV Normalizado

**Data:** 12 de março de 2026  
**Status:** Aceito  
**Contexto do Projeto:** Auditoria de Prontuários (Frente 2 - Engenharia de Dados)

## 1. Contexto e Problema
A estrutura herdada do Google Sheets (Bronze) apresenta o "Wide Table Problem", com mais de 600 colunas. Isso inviabiliza a manutenção, prejudica a performance de escrita e torna impossível a tipagem correta de dados no BigQuery.

## 2. Decisão Arquitetural
Decidimos refatorar a Camada Silver, abandonando a tabela única e adotando um modelo normalizado composto por:
* **silver_respostas:** Tabela de cabeçalho com dados demográficos e metadados (PK: `id_resposta`).
* **silver_detalhes_respostas:** Tabela vertical no modelo EAV (Entity-Attribute-Value), onde cada linha é uma pergunta específica vinculada ao cabeçalho (FK: `id_resposta`).

Também foi decidida a implementação de um **Dicionário de Dados** formal em Markdown para servir como a "única fonte da verdade" para o esquema do banco.

## 3. Consequências

### Positivas:
* **Escalabilidade:** Adicionar novas perguntas ao formulário não exige mais alterar o esquema do banco de dados (Schema-on-read).
* **Integridade:** Uso de UUIDv4 e tipos de dados rigorosos (TIMESTAMP, DATE, STRING).
* **Economia:** Consultas mais eficientes no BigQuery ao filtrar perguntas específicas na tabela de detalhes.

### Negativas/Atenção:
* **Complexidade nas Queries:** A camada Gold agora exige JOINs e operações de *Pivot* para reconstruir a visão plana para o Looker Studio.