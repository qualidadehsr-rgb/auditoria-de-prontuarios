# Guia de Contribuição

Agradecemos o seu interesse em contribuir com o Sistema de Auditoria de Prontuários. Este documento estabelece as diretrizes para garantir que o código se mantenha organizado, escalável e fácil de revisar em nosso ambiente Full-Stack e de Engenharia de Dados.

## Configuração do Ambiente Local

Como este é um *monorepo* poliglota (Node.js, Python e SQL), você precisará configurar os ambientes dependendo da camada que for alterar.

### 1. Pré-requisitos Gerais
1. Realize o *fork* deste repositório e clone-o em sua máquina local.
2. Crie um arquivo `.env` na raiz do projeto com base no arquivo `.env.example`.
3. Solicite a chave de serviço (Service Account JSON) do Google Cloud com permissão de gravação no BigQuery ao administrador e insira no seu `.env` na variável `GOOGLE_CREDENTIALS`.

### 2. Ambiente Web / Ingestão Near-real-time (Node.js)
Se você for trabalhar no Front-end ou na API REST:
1. Certifique-se de ter o [Node.js](https://nodejs.org/) (versão 18 ou superior) instalado.
2. Instale as dependências executando:
  ```bash
    npm install
  ```

3. Inicie o servidor local:
  ```bash
  node index.js
  ```
Atenção: Qualquer novo payload de auditoria deve obrigatoriamente gerar um identificador único (`UUIDv4`) na origem para garantir a rastreabilidade e permitir a deduplicação analítica.

### 3. Ambiente de Dados / ETL Batch (Python)
Se você for trabalhar no pipeline de extração e ingestão legada (BigQuery/Polars):
1. Certifique-se de ter o Python (versão 3.11 ou superior) instalado.

2. Crie e ative um ambiente virtual na raiz do projeto:
  * **Windows:** `python -m venv venv` e depois `venv\Scripts\activate`
  * **Linux/Mac:** `python3 -m venv venv` e depois `source venv/bin/activate`

3. Instale as dependências de engenharia de dados:
  ```bash
  pip install -r requirements.txt
  ```
4. Execute o extrator localmente:
  ```bash
  python etl/extracao_sheets.py
  ```

### 4. Ambiente de Data Warehouse / Transformações (SQL)
Se você for trabalhar nas regras de negócio, Views de consumo ou modelagem EAV no BigQuery:

1. Scripts de carga e transformação oficiais (como o `MERGE`) ficam na pasta `/etl/`.

2. Scripts utilitários e geradores de código (como o extrator de colunas para `UNPIVOT`) ficam na pasta `/scripts/`.

3. **Regra de Ouro:** Todas as querys de inserção/atualização devem ser **Idempotentes**. Utilize comandos `MERGE` com chaves compostas para garantir que múltiplas execuções do mesmo script não gerem duplicidade de dados.


## Padrão de Ramificação (Branching)
Siga o padrão GitFlow simplificado. Nunca faça commits diretamente na branch `main`. Crie uma branch específica para a sua tarefa a partir da `main`:

* Para novas funcionalidades da API ou Front: `feature/nome-da-funcionalidade`

* Para novos pipelines ou modelos de dados: `data/nome-do-modelo ou feature/nome-do-pipeline`

* Para correção de bugs: `bugfix/nome-do-problema`

* Para melhorias técnicas ou refatoração: `chore/atualizacao-dependencias`

## Padrão de Commits
Adotamos a especificação Conventional Commits. Suas mensagens de commit devem ser claras e descritivas:

* `feat`: Uma nova funcionalidade ou pipeline (ex: `feat: cria view de consumo materializada`)

* `fix`: Correção de um bug (ex: `fix: corrige falha no parse da data de avaliacao`)

* `docs`: Alterações apenas na documentação (ex: `docs: atualiza arquitetura no README`)

* `refactor`: Mudança de código estrutural (ex: `refactor: extrai lógica do BigQuery para módulo separado`)

* `ci`: Alterações de infraestrutura e automação (ex: `ci: ajusta cron job para 06h`)

* `test`: Adição ou correção de testes automatizados.

## Processo de Pull Request (PR)

1. Garanta que o seu código rodou sem erros localmente.

2. **Validação de Engenharia:** Se alterou dados, garanta que seu código respeita o contrato do payload, a validação de schema e passou em testes de idempotência (rodar duas vezes não duplica dados).

3. Faça o push da sua branch para o seu repositório forkado.

4. Abra um Pull Request direcionado à branch main deste repositório principal.

5. O GitHub preencherá automaticamente o nosso Template de PR. Marque os checklists correspondentes.

6. Aguarde o Code Review e a validação automática antes do merge.