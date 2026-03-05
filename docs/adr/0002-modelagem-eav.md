### ADR 002: Modelagem de Dados Vertical (Padrão EAV)

* **Data:** Fevereiro de 2026
* **Status:** Aceito e Implementado
* **Contexto:** O formulário de auditoria possui perguntas dinâmicas e opcionais. Salvar todas as 600 possíveis respostas como colunas (Wide Table) gerava dados esparsos (muitos valores nulos) e dificultava agregações no BI.
* **Decisão:** Adotar uma variação do modelo EAV (Entity-Attribute-Value). A carga foi dividida em duas tabelas físicas: `respostas` (metadados do evento da auditoria) e `detalhes_respostas` (itens granulares contendo o par pergunta/resposta e observações).
* **Consequências (Trade-offs):**
  * *Positivo:* Eliminação do problema da tabela larga, flexibilidade para adicionar novas perguntas no formulário sem precisar alterar o esquema (Schema) do banco de dados, e melhora dramática no tempo de resposta das consultas analíticas.
  * *Negativo:* Necessidade de lógicas de "Unpivot" no back-end (Node.js) antes de inserir os dados via Streaming API, aumentando ligeiramente a complexidade da Rota POST.