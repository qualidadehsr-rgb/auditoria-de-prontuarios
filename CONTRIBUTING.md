# Guia de Contribuição

Agradecemos o seu interesse em contribuir com o Sistema de Auditoria de Prontuários. Este documento estabelece as diretrizes para garantir que o código se mantenha organizado, escalável e fácil de revisar.

## Configuração do Ambiente Local

Para executar e modificar este projeto localmente, siga os passos abaixo:

1. Realize o *fork* deste repositório e clone-o em sua máquina local.
2. Certifique-se de ter o [Node.js](https://nodejs.org/) (versão 18 ou superior) instalado.
3. Instale as dependências do projeto executando:
   ```bash
   npm install
   ```
4. Crie um arquivo .env na raiz do projeto com base no arquivo .env.example.
5. Solicite a chave de serviço (Service Account JSON) do Google Cloud com permissão de gravação no BigQuery ao administrador da infraestrutura e insira no seu .env.
6. Inicie o servidor local:
    ```bash
    node index.js
    ```

---

## Padrão de Ramificação (Branching)
Siga o padrão GitFlow simplificado. Nunca faça commits diretamente na branch `main`. Crie uma branch específica para a sua tarefa a partir da `main`:

- Para novas funcionalidades: `feature/nome-da-funcionalidade` (ex: `feature/exportacao-pdf`)
- Para correção de bugs: `bugfix/nome-do-problema` (ex: `bugfix/erro-data-fuso-horario`)
- Para melhorias técnicas ou refatoração: `chore/atualizacao-dependencias`

---

## Padrão de Commits
Adotamos a especificação Conventional Commits. Suas mensagens de commit devem ser claras e descritivas:
- `feat`: Uma nova funcionalidade (ex: `feat: adiciona filtro por ano no dashboard`)
- `fix`: Correção de um bug (ex: `fix: corrige falha no parse da data de avaliacao`)
- `docs`: Alterações apenas na documentação (ex: `docs: atualiza arquitetura no README`)
- `refactor`: Mudança de código que não corrige um bug nem adiciona uma funcionalidade (ex: `refactor: extrai lógica do BigQuery para módulo separado`)
- `test`: Adição ou correção de testes automatizados.

---

## Processo de Pull Request (PR)
1. Garanta que o seu código rodou sem erros localmente.
2. Faça o push da sua branch para o seu repositório forkado.
3. Abra um Pull Request direcionado à branch `main` deste repositório principal.
4. Preencha o template de Pull Request detalhando o que foi alterado e o motivo.
5. Aguarde o Code Review de pelo menos um outro engenheiro da equipe antes do merge.