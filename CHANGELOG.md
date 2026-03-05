# Registo de Alterações (Changelog)

Todos os aspectos notáveis de alterações a este projeto serão documentados neste ficheiro.

O formato baseia-se no standard [Keep a Changelog](https://keepachangelog.com/),
e este projeto adere à [Versionação Semântica](https://semver.org/).

## [1.2.0] - 2026-03-04

### Adicionado
- Implementação de identidade visual no front-end da aplicação web.
- Padronização da paleta de cores com `CSS` na tela de fundo e nos botões.
- Criação de travas de segurança de UX em campos de inserção de datas.

## [1.1.0] - 2026-02-26

### Adicionado
- Integração completa com a API do Google BigQuery através do SDK oficial (`@google-cloud/bigquery`).
- Geração de identificadores únicos universais (UUIDv4) via Node.js para garantir a integridade relacional entre cabeçalhos e detalhes.
- Implementação do padrão de segurança *Fail Fast* no arranque do servidor para validar credenciais de ambiente antes de expor as rotas HTTP.
- Estruturação completa da documentação corporativa (ADR, Guia de Contribuição, Changelog e Templates de PR).

### Alterado
- Arquitetura de armazenamento transitou do Google Sheets para o BigQuery de forma a mitigar o problema de latência e colunas excessivas (*Wide Table Problem*) no Looker Studio.
- Modelagem de dados convertida para o padrão EAV (Entity-Attribute-Value), separando o *payload* do formulário em duas tabelas físicas relacionais (`respostas` e `detalhes_respostas`).
- Otimização do método de análise iterativa das respostas utilizando `Object.entries()` para tratamento assíncrono do *payload*.

### Removido
- Limitação de escala e concorrência de acessos prévia associada à persistência direta na folha de cálculo legada.

## [1.0.0] - 2025-09-15

### Adicionado
- Lançamento da versão inicial (MVP) do Sistema de Auditoria de Prontuários.
- Formulário web dinâmico (Front-End) com listas de setores e especialidades carregadas de forma assíncrona.
- Integração primária com a API do Google Sheets v4 para persistência de dados.
- Estrutura base do servidor em Node.js e Express.