# ADR 0019: UNPIVOT do Sistema Legado utilizando pacote dbt_utils

## Status
Aceito

## Contexto
O histórico de auditorias importado do sistema legado (Google Sheets) apresentava o clássico "Wide Table Problem", contendo mais de 600 colunas horizontais (uma para cada pergunta/item de auditoria). Esse formato causava alta latência no consumo do BI (Looker Studio) e impedia a consolidação limpa com os dados do novo sistema Web, que opera em um modelo vertical (JSON desempacotado).

## Decisão
Decidi verticalizar a tabela legada (transformando colunas em linhas sob o modelo EAV - Entity-Attribute-Value) utilizando a macro `unpivot` do pacote oficial **`dbt_utils`**. 

A transformação converte as 600+ colunas em apenas duas colunas principais de detalhes: `pergunta` e `resposta`, mantendo o `numAtendimento` como chave de junção.

## Consequências
* **Positivas:** * Resolve o gargalo de performance analítica, permitindo que o banco cresça em linhas (barato e rápido) em vez de colunas (caro e lento).
    * Padroniza a estrutura do Legado com o sistema Web (Efeito Espelho), permitindo um `UNION ALL` perfeito na camada Silver.
    * Mantém toda a lógica de transformação dentro do dbt, aproveitando o poder de processamento do BigQuery.
* **Negativas:** * Adiciona uma dependência externa (`dbt_utils`) ao projeto.
    * Como a macro exige a lista de colunas, caso o arquivo legado sofresse adição de novas colunas retroativas, o código do dbt precisaria ser atualizado manualmente (risco mitigado pelo fato de o sistema ser legado e "congelado").