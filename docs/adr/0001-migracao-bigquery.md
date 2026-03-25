## Registros de Decisões Arquiteturais (ADRs)

### ADR 001: Migração do Armazenamento (Google Sheets para Google BigQuery)

* **Data:** Fevereiro de 2026
* **Status:** Aceito e Implementado
* **Contexto:** A versão inicial (MVP) utilizava a API v4 do Google Sheets como banco de dados. Com a escala do projeto, enfrentamos problemas de concorrência (condições de corrida ao salvar registros simultâneos) e limitações severas de performance na leitura dos dados pelo Looker Studio devido ao formato tabular horizontal (mais de 600 colunas).
* **Decisão:** Migrar a camada de persistência definitiva para o Google BigQuery, mantendo temporariamente o Google Sheets em regime de escrita dupla (Dual-write) apenas para contingência (fase de homologação).
* **Consequências (Trade-offs):**
  * *Positivo:* Capacidade de escalabilidade infinita, fim dos bloqueios de concorrência e integração nativa otimizada com o Looker Studio.
  * *Negativo:* Curva de aprendizado maior para novos desenvolvedores, introdução do conceito de "Consistência Eventual" (Streaming Buffer), e necessidade de gerenciamento rigoroso de credenciais (GCP IAM).

* **Critérios adicionais da escolha:**
  * Free tier generoso (10GB armazenamento + 1TB consulta/mês), viabilizando o projeto sem custo inicial
  * Integração nativa com Looker Studio sem configuração intermediária
  * Arquitetura serverless eliminando gestão de infraestrutura
  * Suporte nativo a JSON, partitioning e clustering para otimização de performance
  * Alta demanda em vagas de analytics engineer no mercado brasileiro