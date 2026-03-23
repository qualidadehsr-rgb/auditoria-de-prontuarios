# ADR 0018: Limpeza de Metadados na Camada Staging utilizando Jinja

## Status
Aceito

## Contexto
Durante a migração dos dados históricos do sistema legado (Google Sheets), identifiquei que centenas de nomes de colunas (que representam as perguntas da auditoria) continham caracteres especiais (como o `&`), aspas simples/duplas e acentuações não padronizadas. 

O BigQuery e o dbt apresentaram erros de compilação ao tentar realizar operações de `UNPIVOT` ou referenciar essas colunas diretamente, pois os metadados sujos quebravam a sintaxe do SQL gerado dinamicamente.

## Decisão
Decidi implementar uma etapa de sanitização de strings utilizando a linguagem de template **Jinja** (especificamente a função `replace`) diretamente na camada de *Staging* (Bronze), atuando de forma preventiva. 

A limpeza substitui caracteres problemáticos (ex: `&` por `e`, remoção de aspas) no exato momento da extração dos metadados, antes de qualquer operação estrutural pesada.

## Consequências
* **Positivas:** * Previne erros de compilação (Syntax Errors) em cascata nas camadas Silver e Gold.
    * Mantém a inteligibilidade das perguntas para a camada semântica sem perder a rastreabilidade com o dado original.
    * Isola a complexidade de tratamento de *strings* na camada mais baixa (Bronze).
* **Negativas:** * Aumenta levemente a complexidade do código SQL na Staging devido ao uso intensivo de macros Jinja.
    * Exige manutenção manual da lista de `replace` caso novos caracteres especiais não previstos surjam no futuro.