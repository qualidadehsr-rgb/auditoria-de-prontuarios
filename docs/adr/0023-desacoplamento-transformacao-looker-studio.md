# ADR 0023: Desacoplamento de Transformação do BI e Consumo Exclusivo da Camada Gold

## Contexto
O painel corporativo do Looker Studio estava apresentando alta latência no carregamento das suas 24 páginas. O problema ocorria porque a ferramenta de BI estava sendo forçada a realizar cálculos complexos em tempo real (Filtros REGEX, Pivots e extração de metadados em Strings) diretamente de tabelas não otimizadas, gerando sobrecarga de processamento.

## Decisão
Estabelecido a regra arquitetural de que o **Looker Studio atuará estritamente como uma camada de visualização ("Dumb BI")**. 
* Todo o processamento pesado, cruzamento de dados EAV e lógica de negócio foram transferidos para o **dbt** (Camada Gold - `gold_auditorias_consolidadas`).
* O Looker Studio agora lê exclusivamente essa tabela final, plana e já sumarizada.

## Consequências
* **Positivas:** Redução drástica (mais de 80%) no tempo de carregamento do dashboard. Maior confiabilidade (Single Source of Truth), pois as regras de negócio não ficam escondidas dentro dos gráficos, mas sim versionadas no código SQL do dbt. Redução de custos de *query* no BigQuery.
* **Negativas:** Qualquer nova métrica ou regra complexa solicitada pela diretoria exigirá uma alteração no código do dbt e um novo *deploy*, em vez de uma simples fórmula criada rapidamente na tela do BI.

* **Critérios adicionais da escolha do Looker Studio:**
  * Gratuito e sem limite de usuários, viabilizando acesso para todas as 5 unidades e gestores
  * Integração nativa com BigQuery via conector direto, sem necessidade de ETL intermediário
  * Interface familiar para stakeholders não técnicos, reduzindo necessidade de treinamento
  * Compartilhamento via link, sem necessidade de licença por usuário (diferente do Power BI Pro)