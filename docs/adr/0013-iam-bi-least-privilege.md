# ADR 0013: Implementação de IAM (Privilégio Mínimo) para BI

## Status
Aceito

## Data
17 de Março de 2026

## Contexto e Problema
Com a finalização da Camada Gold no BigQuery, a nossa base de dados está pronta para ser consumida por ferramentas de Business Intelligence (Looker Studio, Metabase, Power BI, etc.).
No entanto, utilizar contas de serviço com privilégios de Administrador ou Editor (como a utilizada pela API para ingestão de dados) para conectar painéis de BI cria um vetor de risco crítico. Se a ferramenta de BI for comprometida ou houver erro humano, a base de dados histórica inteira poderia ser alterada ou excluída.

## Decisão Arquitetural
Decidimos aplicar o **Princípio do Privilégio Mínimo (Least Privilege)** através do Google Cloud IAM.
Foi criada uma Service Account dedicada exclusivamente para consumo analítico (`looker-studio-bi`), com os seguintes papéis (roles) estritos:
1. `roles/bigquery.dataViewer` (Leitor de dados do BigQuery): Permite apenas a leitura (SELECT) dos dados, bloqueando qualquer operação de DML (INSERT, UPDATE, DELETE).
2. `roles/bigquery.jobUser` (Usuário de jobs do BigQuery): Fornece a permissão de processamento necessária para executar as consultas de leitura.

## Consequências

### Positivas:
* **Segurança de Dados:** Elimina o risco de deleção ou alteração acidental da base histórica via ferramentas de relatórios.
* **Escalabilidade:** A chave JSON gerada serve como padrão de conexão agnóstico, podendo ser plugada em qualquer ferramenta de mercado além do Looker Studio.
* **Auditoria (Logs):** O Google Cloud Operations consegue rastrear exatamente o custo e o volume de dados processados separadamente pelo painel de BI.

### Negativas/Atenção:
* É necessário gerenciar o ciclo de vida da chave JSON dessa Service Account. Se a chave for rotacionada ou revogada, a conexão do painel de BI cairá até que seja atualizada.