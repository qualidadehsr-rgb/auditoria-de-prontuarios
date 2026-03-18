# 0016 - Setup do dbt Cloud e Integração com BigQuery e GitHub

**Data:** 18 de março de 2026
**Status:** Aceito

## 1. Contexto
Com a ingestão de dados brutos (camada Bronze) estabelecida no BigQuery (incluindo a transição para o formato JSON documentada na ADR 0015), o projeto necessitava de uma ferramenta robusta para orquestrar e executar as transformações de dados para as camadas Silver e Gold. Precisávamos de um ambiente que garantisse o versionamento do código, a aplicação de boas práticas de engenharia de software (como testes e documentação) e uma integração segura com o nosso data warehouse.

## 2. Decisão
Decidimos adotar o **dbt Cloud** como o ambiente oficial de desenvolvimento e orquestração das transformações de dados do projeto. 

Para viabilizar essa arquitetura, as seguintes configurações foram estabelecidas:

* **Integração de Código (Versionamento):** O dbt Cloud foi conectado diretamente ao repositório GitHub `auditoria-de-prontuarios`. Toda alteração estrutural no dbt inicializou o repositório (`dbt_project.yml`, `models/`, etc.) e o fluxo de trabalho passa a exigir a criação de *branches* e aprovação via *Pull Requests* para a `main`.
* **Integração de Banco de Dados:** O dbt Cloud foi conectado ao projeto Google Cloud `comissao-prontuario` (BigQuery).
* **Segurança e Permissões:** Foi criada uma Service Account dedicada exclusivamente para a orquestração do dbt: `dbt-orquestrador@comissao-prontuario.iam.gserviceaccount.com`. 
* **Papéis (Roles) atribuídos à Service Account:**
  * *Editor de dados do BigQuery*: Para permitir a criação, atualização e exclusão das tabelas materializadas pelo dbt nas camadas Silver e Gold.
  * *Usuário de sessão de leitura do BigQuery* (BigQuery Read Session User): Para permitir a leitura eficiente dos dados brutos através da BigQuery Storage API.

## 3. Consequências
* **Positivas:** * O código de transformação passa a ser tratado como engenharia de software, com versionamento centralizado no GitHub.
  * Isolamento de segurança garantido pelo uso de uma Service Account dedicada com o princípio do menor privilégio.
  * O ambiente em nuvem dispensa a necessidade de configurações complexas na máquina local dos desenvolvedores.
* **Negativas / Riscos:** * Adiciona-se uma nova dependência externa (dbt Cloud) à arquitetura do projeto.
  * O fluxo de desenvolvimento exige uma adaptação à interface do dbt Cloud para realizar as operações do Git (Commit, Pull, PRs).