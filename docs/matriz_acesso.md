# Matriz de Acesso — comissao-prontuario

**Última atualização:** 02 de abril de 2026

## Service Accounts (Google Cloud)

| Conta | Usado em | Papéis GCP | Acessa |
|---|---|---|---|
| `aplicacao-formulario` | Render (produção) | Editor de dados BigQuery + Usuário de jobs | Escrita na Bronze (`prontuarios_dados`) |
| `dbt-orquestrador` | dbt Cloud + local dev | Editor de dados BigQuery + Usuário de jobs + Usuário de sessão de leitura | Leitura e escrita em todos os datasets |
| `looker-studio-bi` | Looker Studio | Leitor de dados BigQuery + Usuário de jobs | Leitura somente na Gold (`dbt_qualidadehsr`) |

## Usuários

| Usuário | Acesso | Nível |
|---|---|---|
| `qualidade.hsr@gruposanta.com.br` | BigQuery Console + dbt Cloud + GCP Console | Proprietário do projeto |
| Equipe do setor de qualidade | Looker Studio apenas | Visualização da Gold |

## Regras de acesso

- Nenhum usuário acessa Bronze ou Silver diretamente em produção
- Looker Studio conecta apenas à tabela `gold_auditorias_consolidadas`
- Chaves de service account nunca ficam no repositório Git
- Credenciais de produção armazenadas no Google Secret Manager (ADR 0026)
- Toda nova chave criada deve ser registrada neste documento com data

## Histórico de alterações de acesso

| Data | Alteração |
|---|---|
| 31/03/2026 | Removido papel `Administrador do BigQuery` da `aplicacao-formulario` |
| 31/03/2026 | Removido acesso da `robo-salva-planilha` (projeto encerrado) |
| 31/03/2026 | Adicionado papel `Usuário de jobs do BigQuery` à `aplicacao-formulario` |
| 31/03/2026 | Deletadas chaves órfãs de `aplicacao-formulario` (set/2025 e mar/2026) |
| 31/03/2026 | Deletada chave órfã de `dbt-orquestrador` (26/03/2026) |