# Documento de Arquitetura e Decisões (ADR)

Este documento registra as principais decisões arquiteturais tomadas durante o desenvolvimento e evolução do Sistema de Auditoria de Prontuários. O formato segue o padrão de Architecture Decision Records (ADRs) para fornecer contexto histórico aos futuros mantenedores do projeto.

## Visão Geral do Sistema

O sistema opera em uma arquitetura de três camadas tradicionais (Client, Server, Database), com foco em processamento assíncrono e modelagem orientada a Analytics (OLAP).

1. **Camada de Apresentação (Client):** Renderização estática servida via Express. O cliente gerencia o estado do formulário e se comunica via chamadas RESTful.
2. **Camada de Aplicação (Server):** Node.js atuando como um middleware de integração. Responsável por sanitização, transformação de payload (JSON para modelo relacional) e injeção no Data Warehouse.
3. **Camada de Dados (Database):** Google BigQuery atuando como repositório centralizado, alimentando os dashboards no Looker Studio.

---

## Registros de Decisões Arquiteturais (ADRs)

### ADR 001: Migração do Armazenamento (Google Sheets para Google BigQuery)

* **Data:** Fevereiro de 2026
* **Status:** Aceito e Implementado
* **Contexto:** A versão inicial (MVP) utilizava a API v4 do Google Sheets como banco de dados. Com a escala do projeto, enfrentamos problemas de concorrência (condições de corrida ao salvar registros simultâneos) e limitações severas de performance na leitura dos dados pelo Looker Studio devido ao formato tabular horizontal (mais de 600 colunas).
* **Decisão:** Migrar a camada de persistência definitiva para o Google BigQuery, mantendo temporariamente o Google Sheets em regime de escrita dupla (Dual-write) apenas para contingência (fase de homologação).
* **Consequências (Trade-offs):**
  * *Positivo:* Capacidade de escalabilidade infinita, fim dos bloqueios de concorrência e integração nativa otimizada com o Looker Studio.
  * *Negativo:* Curva de aprendizado maior para novos desenvolvedores, introdução do conceito de "Consistência Eventual" (Streaming Buffer), e necessidade de gerenciamento rigoroso de credenciais (GCP IAM).

### ADR 002: Modelagem de Dados Vertical (Padrão EAV)

* **Data:** Fevereiro de 2026
* **Status:** Aceito e Implementado
* **Contexto:** O formulário de auditoria possui perguntas dinâmicas e opcionais. Salvar todas as 600 possíveis respostas como colunas (Wide Table) gerava dados esparsos (muitos valores nulos) e dificultava agregações no BI.
* **Decisão:** Adotar uma variação do modelo EAV (Entity-Attribute-Value). A carga foi dividida em duas tabelas físicas: `respostas` (metadados do evento da auditoria) e `detalhes_respostas` (itens granulares contendo o par pergunta/resposta e observações).
* **Consequências (Trade-offs):**
  * *Positivo:* Eliminação do problema da tabela larga, flexibilidade para adicionar novas perguntas no formulário sem precisar alterar o esquema (Schema) do banco de dados, e melhora dramática no tempo de resposta das consultas analíticas.
  * *Negativo:* Necessidade de lógicas de "Unpivot" no back-end (Node.js) antes de inserir os dados via Streaming API, aumentando ligeiramente a complexidade da Rota POST.

### ADR 003: Inicialização da Aplicação com Padrão "Fail Fast"

* **Data:** Fevereiro de 2026
* **Status:** Aceito e Implementado
* **Contexto:** Serviços em nuvem podem falhar silenciosamente se variáveis de ambiente ou credenciais estiverem incorretas ou ausentes.
* **Decisão:** O servidor Node.js deve tentar carregar e parsear as credenciais do BigQuery antes de abrir a porta de escuta HTTP. Caso a credencial seja inválida, a aplicação invoca um `process.exit(1)`.
* **Consequências (Trade-offs):**
  * *Positivo:* Evita que a aplicação suba em um estado degradado, impedindo que o usuário preencha uma auditoria inteira para só no final descobrir que o banco de dados está inacessível.
  * *Negativo:* O container da aplicação não iniciará caso a injeção de secrets da plataforma de hospedagem (Render) falhe.