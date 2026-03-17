# Guia de Contribuição

Agradecemos o seu interesse em contribuir com o Sistema de Auditoria de Prontuários. Este documento estabelece as diretrizes para garantir que o código se mantenha organizado, escalável, rastreável e fácil de revisar em nosso ambiente Full-Stack e de Engenharia de Dados.

## 🛡️ Segurança de Credenciais (Crítico)

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

### 3. Ambiente de Dados / ELT Batch e Metadados (Python)
Se você for trabalhar no pipeline de extração ou metadados:
1. Certifique-se de ter o Python (versão 3.11 ou superior) instalado.
2. Crie e ative um ambiente virtual (`venv`).
3. Instale as dependências: `pip install -r requirements.txt`
4. **Regra de Metadados (Docs-as-Code):** Se alterar a constante `ESTRUTURA_FORMULARIO` no Front-end, você **deve** rodar o extrator (`python scripts/extrai_dicionario_real.py`) para manter a Camada Gold e o Dicionário de Dados sincronizados.

### 4. Ambiente de Data Warehouse / Transformações (SQL)
Se você for trabalhar nas regras de negócio no BigQuery:
1. Scripts oficiais de Views e Tabelas ficam na pasta `/etl/`.
2. **Lógica FinOps (Métricas):** Ao alterar a `gold_view_consolidada.sql`, mantenha a lógica binária de conformidade (`qtde_conforme` e `qtde_valida`). Não mova cálculos complexos para o Looker Studio; mantenha-os no SQL para garantir performance e baixo custo de processamento.
3. **Idempotência:** Utilize sempre comandos `MERGE` para evitar duplicidade de dados em reprocessamentos.

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