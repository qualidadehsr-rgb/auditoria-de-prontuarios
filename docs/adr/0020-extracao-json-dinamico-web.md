# ADR 0020: Extração Dinâmica de JSON (Unpivot) na Camada Staging (Web)

## Status
Aceito

## Contexto
A API de ingestão do sistema Web salva o payload completo das respostas dos auditores em uma única coluna do tipo JSON (`conteudo_bruto`). Para consolidar esses dados com o sistema Legado sob o modelo EAV (Entity-Attribute-Value), precisava extrair cada par de chave-valor (pergunta-resposta) em linhas separadas. 

A limitação técnica imposta pelas políticas de segurança da nuvem impediu o uso de funções utilitárias públicas (como as do dataset `bqutil` do Google), exigindo uma solução nativa e sem hardcoding das mais de 600 chaves possíveis.

## Decisão
Decidi implementar um "Unpivot dinâmico de JSON" utilizando exclusivamente funções nativas do BigQuery e SQL padrão dentro do dbt. 

A solução utiliza `REGEXP_EXTRACT_ALL` para varrer as chaves do objeto JSON como texto, aplica o `UNNEST` para transformar o array resultante em múltiplas linhas, e utiliza a notação de colchetes do BigQuery (`conteudo_bruto[chave]`) para extrair o valor correspondente a cada chave iterada.

## Consequências
* **Positivas:** * Permite a extração dinâmica de qualquer formulário futuro, sem necessidade de mapear novas colunas no código SQL.
    * Evita dependências externas de datasets públicos ou UDFs (User Defined Functions) em JavaScript, garantindo máxima performance e segurança.
    * Gera o "Efeito Espelho" perfeito com o sistema legado, entregando o modelo (ID, Pergunta, Resposta) para a camada Silver.
* **Negativas:** * A sintaxe SQL (`REGEXP` + `UNNEST` + JSON Path) eleva a complexidade de leitura do código para analistas menos experientes.
    * Transforma todos os valores extraídos em formato de texto (`STRING`), delegando tipagens mais complexas (como números e datas) para as camadas subsequentes (Silver/Gold).