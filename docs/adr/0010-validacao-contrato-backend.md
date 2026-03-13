# ADR 0010: Implementação de Validação de Contrato (Schema Validation) Nativa na API

## Status
Aceito

## Data
13 de Março de 2026

## Contexto e Problema
O sistema dependia exclusivamente de validações no Front-end (tags HTML `required` e bloqueios de calendário) para garantir a integridade dos dados enviados pelos auditores. Contudo, APIs são interfaces públicas. O envio de requisições HTTP diretas (via scripts, Postman ou falhas de rede) com payloads vazios ou incompletos poderia contornar o Front-end, resultando em erros de processamento no Node.js ou na gravação de "lixo" (dados nulos) diretamente no BigQuery.

## Decisão Arquitetural
Decidimos implementar uma camada de **Schema Validation (Validação de Contrato)** diretamente no Back-end (API Node.js) atuando como um Middleware na rota de ingestão (`/api/salvar-dados`). 

Para manter o serviço leve e com poucas dependências, optamos por não utilizar bibliotecas externas de validação (como `Zod`, `Joi` ou `Ajv`). Em vez disso, construímos uma validação nativa em JavaScript que itera sobre um array de `camposObrigatorios` e aplica o padrão **Fail Fast**: se qualquer campo essencial do cabeçalho estiver ausente, a API recusa o pacote com um HTTP 400 (Bad Request) antes de qualquer interação com o banco de dados.

## Consequências

### Positivas:
* **Proteção do Data Warehouse:** Garantia de que a Camada Bronze/Silver nunca receberá registros sem a chave de identificação, empresa, setor ou data.
* **FinOps (Redução de Custos):** Requisições malformadas são barradas na API (custo computacional quase zero), evitando o disparo de queries de erro custosas no BigQuery.
* **Segurança:** Adoção da premissa "Nunca confie no cliente (Front-end)".

### Negativas/Atenção:
* A lista de `camposObrigatorios` no código da API (`index.js`) precisa ser atualizada manualmente caso a estrutura do cabeçalho do formulário seja alterada no futuro.