# ADR 0021: Implementação de Surrogate Key para Unificação de Auditorias

**Data:** 23 de Março de 2026
**Status:** Aceito

## 1. Contexto
Durante a consolidação da Camada Silver, identifiquei que o Número de Atendimento não é suficiente para garantir a unicidade de um registro de auditoria. Um único atendimento de paciente pode sofrer múltiplas auditorias em diferentes setores, datas ou especialidades. No sistema Legado (Google Sheets), não havia um ID único nativo para cada submissão, gerando risco de duplicação de dados e erros de agregação em joins entre as tabelas de Capa e Detalhes.

## 2. Decisão
Decidi implementar uma Surrogate Key (Chave Substituta) determinística utilizando a macro dbt_utils.generate_surrogate_key.

- **Composição da Chave:** `numAtendimento` + `Timestamp`.

- **Algoritmo:** A macro aplica um hash MD5 sobre a combinação desses campos, gerando um ID alfanumérico único para cada submissão.

- **Padronização:** O mesmo ID foi aplicado no sistema Web (renomeando `id_submissao`) para garantir um "Efeito Espelho" perfeito.

## 3. Consequências
- **Positivas:**
    - Garantia de integridade referencial entre as tabelas `silver_respostas` e `silver_detalhes`
    - Possibilidade de realizar testes de unique e relationships no dbt.
    - Eliminação da ambiguidade na contagem de auditorias realizadas.

- **Negativas:**
    - Leve aumento no processamento inicial para geração do Hash.
    - Dependência do pacote `dbt_utils`.