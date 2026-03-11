# ADR 0006: Implementação da Camada Gold e Dicionário de Metadados via Python (Docs-as-Code)

## Status
Aceite

## Data
11 de Março de 2026

## Contexto
O pipeline de dados processa auditorias de prontuários médicos. Na camada Silver, utilizamos uma modelagem EAV (Entity-Attribute-Value) para lidar com a flexibilidade do formulário. No entanto, os IDs das perguntas armazenados na base de dados (ex: `Clinico_HDA_QuadroClinico_Resp`) são técnicos e não servem para consumo direto pelas áreas de negócio (Direção e Qualidade) no BI.

Inicialmente, tentei criar a Camada Gold (Semântica) utilizando funções de `REGEXP_REPLACE` diretamente no SQL (BigQuery) para formatar os IDs em texto legível. Contudo, esta abordagem mostrou-se frágil:
1. Nomes em *CamelCase* ficavam incompletos (ex: "Info Clara" em vez de "Informação Clara").
2. Falhas na identificação de padrões devido a variações no sufixo (`_Resp`, `_Obs`).
3. Risco de desalinhamento futuro entre o texto apresentado no ecrã do médico e o texto exibido no dashboard.

## Decisão
Decidi abandonar a formatação baseada em Regex no SQL e adotar uma abordagem de **Extração de Metadados (Single Source of Truth)** para a construção da nossa Camada Gold:

1. **Dicionário de Dados Oficial:** Criei um script Python (`extrai_dicionario_real.py`) que consome diretamente a estrutura de configuração do Front-end (`ESTRUTURA_FORMULARIO`) em JavaScript/JSON. O script "aplana" (flatten) a estrutura e gera um ficheiro CSV oficial (`dicionario_oficial.csv`) contendo a tradução exata do `codigo_base` para a `pergunta_formatada`.
2. **View Semântica (Pivot):** Construi a view `gold_auditorias_consolidadas` no BigQuery. Esta view realiza um pivot condicional (transformando linhas de EAV em colunas de `resposta_conformidade` e `observacao_texto`) e faz um `LEFT JOIN` com o Dicionário de Dados.

## Consequências

### Positivas
* **Governança Total:** O que o auditor lê no formulário é exatamente o que o diretor lê no dashboard. Não há margem para interpretações dúbias.
* **Manutenção Centralizada (Docs-as-Code):** Se o formulário for atualizado, basta correr o script Python novamente e fazer o upload do metadado. O pipeline SQL não precisa ser reescrito.
* **Camada Gold Limpa:** O Looker Studio (BI) passa a consumir uma visão consolidada, de fácil compreensão, desacoplada das complexidades transacionais e da estrutura EAV da camada Silver.

### Negativas
* Adicionei um passo manual/semi-automático ao fluxo de trabalho: a execução do script Python e o carregamento do CSV no BigQuery tornam-se necessários sempre que houver alterações nas perguntas do sistema base. No futuro, isto pode ser mitigado via automação de CI/CD.