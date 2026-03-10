# ADR 0005: Modelagem EAV (Entity-Attribute-Value) para superação do 'Wide Table Problem' no Legado
* **Status: Accepted**
* **Data: 10-03-2026**

* **1. Contexto**
O sistema legado (Google Sheets) apresentava uma estrutura de "tabela larga" (Wide Table) com mais de 600 colunas de perguntas. Essa arquitetura gerava três problemas críticos:

1. **Limitação de Escala:** Inviabilidade de análise no BigQuery devido ao excesso de colunas e valores nulos (Sparsity).

2. **Rigidez de Schema:** Necessidade de alterar a estrutura da tabela a cada nova pergunta adicionada ao formulário.

3. **Performance no BI:** Lentidão extrema no Looker Studio ao tentar processar centenas de métricas horizontais.

* **2. Decisão**
Implementar a modelagem **EAV (Entity-Attribute-Value)** para a camada Silver de detalhes das respostas, utilizando o comando `UNPIVOT` para a transformação dos dados históricos.

* **Ingestão Near-real-time:** As novas auditorias via API Node.js são enviadas ao BigQuery Streaming API, garantindo baixa latência de disponibilidade analítica sem a sobrecarga de um banco OLTP tradicional.

* **Normalização EAV:**
    * **Entidade:** `id_resposta` (Chave estrangeira relacionando ao cabeçalho).
    * **Atributo:** `nome_pergunta` (Nome técnico da pergunta extraído do cabeçalho da coluna).
    * **Valor:** `valor_resposta` (Resposta textual ou qualitativa).

* **3. Garantia de Integridade e Concorrência**
Para evitar duplicidades e garantir a idempotência do processo (capacidade de rodar o script várias vezes sem alterar o resultado final), definimos:

* **UUIDv4:** Atribuição de um identificador único universal (`id_detalhe`) para cada linha de atributo.

* **Lógica de MERGE:** O processo de carga utiliza uma chave composta (`id_resposta + nome_pergunta`) para decidir entre inserir um novo registro ou ignorar um já existente.

* **4. Consequências**
    * *Positivas:* Flexibilidade total: novas perguntas no formulário tornam-se novas linhas no banco, não novas colunas.
        * Redução drástica de armazenamento ao ignorar campos não preenchidos (NULLs).
    * *Compromissos (Trade-offs):* Aumento na complexidade das queries de extração.         
        * Necessidade de criação de Views de Consumo no BigQuery para reapresentar os dados de forma legível ao Looker Studio.