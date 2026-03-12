# ADR 0007: Implementação de Observabilidade e Logs Estruturados na API

**Data:** 12 de março de 2026  
**Status:** Aceito  
**Contexto do Projeto:** Auditoria de Prontuários (Frente 3 - Governança e Observabilidade)

## 1. Contexto e Problema
À medida que a API Node.js avança para produção, os logs tradicionais baseados em texto simples (`console.log` e `console.error`) tornam-se insuficientes. Em um cenário de requisições simultâneas de vários auditores, se uma inserção falhar no BigQuery, é extremamente difícil rastrear qual requisição exata causou o erro e qual era o payload associado. Precisávamos de uma forma de rastrear o ciclo de vida completo de cada chamada à API.

## 2. Decisão Arquitetural
Decidimos implementar **Logs Estruturados em formato JSON** de forma nativa e injetar um **Request ID único** em cada requisição, sem adicionar bibliotecas externas pesadas (como Winston ou Morgan) para manter a aplicação leve.

As ações tomadas foram:
* Criação de um *Middleware* global no Express (`app.use`) que intercepta toda requisição de entrada.
* Geração de um identificador único (`uuidv4`) associado ao objeto da requisição (`req.request_id`).
* Padronização de todas as saídas do console (`console.log` e `console.error`) para o formato `JSON.stringify`, incluindo chaves obrigatórias como `severity`, `request_id`, `endpoint` e `message`.

## 3. Consequências

### Positivas:
* **Rastreabilidade Ponta a Ponta:** Qualquer erro estourado na aplicação agora possui um `request_id` que pode ser cruzado com a requisição de origem.
* **Compatibilidade com Cloud:** Plataformas de nuvem (como Render e Google Cloud Logging) analisam nativamente logs em JSON, permitindo filtros avançados (ex: filtrar apenas logs com `severity: 'ERROR'`).
* **Baixo Acoplamento:** Solução implementada com recursos nativos do Node.js/Express, sem adicionar novas dependências ao `package.json`.

### Negativas/Atenção:
* **Verbosidade no Código:** Os blocos `catch` ficaram levemente mais extensos para acomodar a montagem do objeto JSON antes do log.
* **Treinamento:** Novos desenvolvedores precisarão seguir a convenção de não usar `console.log("texto livre")` no backend, respeitando o formato de objeto estruturado.