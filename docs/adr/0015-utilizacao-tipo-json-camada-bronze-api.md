# ADR 0015: Utilização do tipo de dado JSON para armazenamento bruto na Camada Bronze da API

## Status
Aceito (18 de Março de 2026)

## Contexto
Com a transição do sistema de auditoria baseado em Google Sheets para um novo formulário web suportado por uma API Node.js, surgiu a necessidade de definir como os dados brutos seriam ingeridos no BigQuery. 

O sistema legado (`bronze_legado_respostas`) utilizava uma tabela *flat* com mais de 600 colunas fixas. Replicar essa arquitetura para o novo sistema traria problemas severos de manutenção: qualquer nova pergunta adicionada ao formulário web exigiria uma intervenção manual no banco de dados (`ALTER TABLE`) e uma alteração complexa no código de mapeamento da API.

Além disso, a API estava realizando um atalho (ETL em tempo real), inserindo os dados processados diretamente na Camada Silver e ignorando o armazenamento do dado bruto original, o que feria o princípio de reprocessabilidade e rastreabilidade da arquitetura Medallion.

## Decisão
Decidimos implementar a tabela `bronze_respostas_web` utilizando o tipo nativo **JSON** do BigQuery para armazenar o *payload* integral enviado pelo formulário web.

A estrutura da tabela foi simplificada para apenas três colunas:
1. `id_submissao` (STRING): UUID gerado pela API para rastreabilidade.
2. `data_hora` (TIMESTAMP): Carimbo gerado automaticamente pelo BigQuery (`DEFAULT CURRENT_TIMESTAMP`).
3. `conteudo_bruto` (JSON): O objeto de dados (`req.body`) completo.

A API Node.js foi refatorada para inserir o dicionário bruto nesta tabela imediatamente ao receber a requisição, atuando como um "seguro de vida" (Camada Bronze pura) antes de aplicar as transformações de negócio para a Camada Silver.

## Consequências

### Pontos Positivos:
* **Flexibilidade Extrema (Schema Evolution):** Novas perguntas e campos no formulário web são absorvidos automaticamente pelo campo JSON, eliminando a necessidade de manutenção estrutural (DDL) no BigQuery.
* **Desacoplamento:** A API Node.js fica mais leve e com menos responsabilidades, focando apenas na ingestão rápida. A lógica de transformação de tipos e regras de negócio fica concentrada inteiramente no SQL (Camada Silver).
* **Segurança de Dados:** Garantia de que o dado 100% original (como enviado pelo usuário) está salvo e imutável, permitindo o reprocessamento da Camada Silver em caso de falhas lógicas no pipeline.

### Pontos de Atenção:
* **Curva de Aprendizado no SQL:** As consultas de transformação (da Bronze para a Silver) exigirão o uso de notação de ponto (ex: `conteudo_bruto.nomeEmpresa`) e funções de tipagem forte (ex: `SAFE.STRING()`) para extrair os valores de dentro do objeto JSON.