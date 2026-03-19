# 0017 - Migração para Ingestão Pura (ELT) e Centralização de Transformações no dbt

**Data:** 19 de março de 2026
**Status:** Aceito

## 1. Contexto
A lógica de ingestão estava fatiando os campos do arquivo JSON distribuindo os dados nas tabelas bronze e silver, criando duas funções para aplicação node.js. Isso gera risco de inconsistência na entrada dos dados e possível conflito nos tratamentos a serem realizados na camada silver com dbt.

## 2. Decisão
Centralizei toda lógica de transformação (JSON Parsing) no **dbt Cloud**, mantendo o Node.js apenas como transportador para a camada Bronze. 

## 3. Consequências
* **Positivas:**
    * Maior facilidade de manutenção, desacoplamento do front-end com o esquema da Silver e garantia de que o dbt é a única "fonte da verdade" para regras de negócio.
    * Garantia de *Atomicidade* na ingestão: o sucesso da operação no Node.js agora depende de uma única transação com o BigQuery (apenas a camada Bronze).
