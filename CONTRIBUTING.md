# Guia de Contribuição

Agradecemos o seu interesse em contribuir com o Sistema de Auditoria de Prontuários. Este documento estabelece as diretrizes para garantir que o código se mantenha organizado, escalável, rastreável e fácil de revisar em nosso ambiente Full-Stack e de Engenharia de Dados.

## Segurança de Credenciais (Crítico)

Este projeto manipula dados sensíveis e chaves de acesso ao Google Cloud. **Nunca, sob nenhuma circunstância, adicione arquivos JSON de chaves de serviço ao controle de versão (Git).**

1. O arquivo `.gitignore` está configurado com o padrão `comissao-prontuario-*.json` para ignorar automaticamente as chaves.
2. Se você criar uma nova chave de conta de serviço, certifique-se de que o nome do arquivo siga este padrão ou mova-a para fora da pasta do projeto.
3. Prefira utilizar variáveis de ambiente (`.env`) para armazenar o conteúdo das chaves em vez de apontar para arquivos físicos no código de produção.

---

## Configuração do Ambiente Local

Como este é um *monorepo* poliglota (Node.js, Python e SQL), você precisará configurar os ambientes dependendo da camada que for alterar. O projeto segue os princípios da **Arquitetura Medalhão** (Bronze, Silver e Gold) e processamento **ELT**.

### 1. Pré-requisitos Gerais
1. Realize o *fork* deste repositório e clone-o em sua máquina local.
2. Crie um arquivo `.env` na raiz do projeto com base no arquivo `.env.example`.
3. Solicite a chave de serviço (Service Account JSON) do Google Cloud ao administrador. **Mantenha este arquivo seguro e fora do rastreamento do Git.**

### 2. Ambiente Web / Ingestão Near-real-time (Node.js)
Se você for trabalhar no Front-end ou na API REST:
1. Certifique-se de ter o Node.js (versão 18 ou superior) instalado.
2. Instale as dependências: `npm install`
3. Inicie o servidor local: `node index.js`

> **Atenção:** Qualquer novo payload de auditoria deve gerar um identificador único (UUIDv4) na origem para garantir a rastreabilidade e permitir a deduplicação analítica.
**Regra de Ouro da Ingestão Pura:** O Node.js atua exclusivamente como transportador. É terminantemente proibido adicionar lógica de fatiamento de payload, tipagem ou criação de regras de negócio nesta camada (backend). O formulário web deve ser salvo integralmente como um objeto JSON fechado (`conteudo_bruto`) na camada Bronze. Toda a transformação ocorrerá no dbt.

### 3. Ambiente de Dados / ELT Batch e Metadados (Python)
Se você for trabalhar no pipeline de extração ou metadados:
1. Certifique-se de ter o Python (versão 3.11 ou superior) instalado.
2. Crie e ative um ambiente virtual (`venv`).
3. Instale as dependências: `pip install -r requirements.txt`
4. **Regra de Metadados (Docs-as-Code):** Se alterar a constante `ESTRUTURA_FORMULARIO` no Front-end, você **deve** rodar o extrator (`python scripts/extrai_dicionario_real.py`) para manter a Camada Gold e o Dicionário de Dados sincronizados.

### 4. Ambiente de Data Warehouse / Transformações (SQL via dbt)
**Atenção: A criação ou atualização manual de tabelas via scripts soltos ou Node.js está estritamente proibida para as camadas Silver e Gold.**

1. **Centralização no dbt:** Toda a responsabilidade de transformação, unpivot de JSON (`JSON_VALUE`), padronização e testes ACID pertence ao dbt. Não crie rotinas de banco de dados fora dele.
2. **Lógica FinOps (Métricas):** As regras de cálculo binário (`qtde_conforme` e `qtde_valida`) devem ser materializadas nos modelos `.sql` da camada Gold do dbt. Não mova cálculos complexos para o Looker Studio para garantir performance e baixo custo de leitura.
3. **Idempotência:** Não é mais necessário escrever comandos `MERGE` complexos na mão. A idempotência é garantida nativamente pelo motor de materialização do dbt (`table`, `view` ou `incremental`).
4. **Configuração de Materialização:** Sempre defina explicitamente o tipo de materialização no topo do arquivo SQL (ex: `materialized='table'`). Evite o uso de `SELECT *` em modelos de staging para prevenir erros de colunas duplicadas ou schemas corrompidos.

### 5. Fluxo de Trabalho (Engenharia de Analytics com dbt)

Todo o desenvolvimento das camadas de transformação de dados (Silver e Gold) é realizado através do **dbt Cloud**.

1. **Nunca faça commits diretos na `main`:** A branch `main` é protegida e representa o ambiente de produção/oficial.
2. **Crie uma nova branch no dbt Cloud:** Sempre inicie o trabalho clicando em "Create new branch" a partir da interface do dbt. Use nomes curtos e descritivos (ex: `feature/nova-tabela-gold`, `fix/correcao-regra-negocio`).
3. **Desenvolva e Teste:** Escreva seus modelos (`.sql`), arquivos de configuração (`.yml`) e clique em *Run* ou *Build* no dbt Cloud para testá-los no BigQuery (schema de desenvolvimento).
4. **Commit & Sync:** Após validar, realize o commit através da interface do dbt Cloud com uma mensagem clara sobre o que foi alterado.
5. **Pull Request (PR):** Clique no botão do dbt Cloud para abrir um PR no GitHub. Um revisor (ou você mesmo, após revisão criteriosa) deve aprovar (Merge) o código para a `main`.
6. **Sincronização Local:** Após realizar o Merge no GitHub, lembre-se de voltar ao VS Code ou ao dbt Cloud e realizar o "Pull from Remote/Main" para garantir que seu ambiente local não fique defasado.

---

## Padrão de Ramificação (Branching)
Nunca faça commits diretamente na branch `main`. Crie uma branch a partir da `main`:

* `feature/nome-da-funcionalidade` (API/Front)
* `data/nome-do-modelo` (Engenharia de Dados/SQL)
* `bugfix/nome-do-problema`
* `chore/atualizacao-tecnica` (Refatoração, Gitignore, Dependências)

## Padrão de Commits
Adotamos **Conventional Commits**:

* `feat`: Nova funcionalidade, pipeline ou view.
* `fix`: Correção de bug.
* `docs`: Alterações em documentação ou dicionários.
* `chore`: Atualizações de infraestrutura, segurança ou build (ex: atualizar `.gitignore`).
* `refactor`: Mudança de código estrutural sem alterar funcionalidade.

## Processo de Pull Request (PR)

1. Garanta que o código rodou sem erros localmente.
2. **Verificação de Segurança:** Certifique-se de que nenhum arquivo `.json` de credenciais foi incluído acidentalmente no commit (`git status` é seu amigo).
3. Abra o PR para a branch `main`.
4. Marque os itens no checklist do template de PR (Engenharia, Testes, Documentação).