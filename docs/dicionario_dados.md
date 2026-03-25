# Dicionário de Dados

## Granularidade das Tabelas

| Tabela | Uma linha representa |
|--------|---------------------|
| bronze_respostas_web | Uma submissão de auditoria com payload JSON bruto |
| bronze_legado_respostas | Uma submissão de auditoria com 600+ colunas horizontais |
| silver_respostas | Uma auditoria realizada (um prontuário avaliado em uma data) |
| silver_detalhes | Uma resposta a uma pergunta dentro de uma auditoria |
| gold_auditorias_consolidadas | Uma resposta com todos os metadados da auditoria e a pergunta formatada |
| dim_perguntas | Uma pergunta do formulário com seu código e label formatado |

## Relacionamento entre Tabelas

    silver_respostas (1) ──── id_auditoria ────> (N) silver_detalhes
                                                        │
                                                  codigo_pergunta
                                                        │
    dim_perguntas (1) ──── codigo_base ────────> (N) gold_auditorias_consolidadas

### Chaves de Ligação
- **id_auditoria**: conecta silver_respostas com silver_detalhes. No sistema Web é o UUID (id_submissao). No sistema Legado é uma Surrogate Key MD5 gerada sobre (numAtendimento + Timestamp).
- **codigo_pergunta / codigo_base**: conecta silver_detalhes com dim_perguntas. O código segue o padrão TipoAvaliacao_Tema_Pergunta (ex: Clinico_HDA_QuadroClinico).

## Camada Bronze & Origem de Dados

### Tabela: `bronze_legado_respostas`
*O nosso Data Lake imutável do passado. Esta tabela armazena o histórico bruto, atuando como um espelho de segurança da base original do Google Sheets. Nenhuma limpeza ou regra de negócio é aplicada aqui.*

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| **Timestamp** | TIMESTAMP | Carimbo exato de data/hora gerado pelo sistema no momento da submissão do formulário antigo. |
| **(Colunas do Formulário)** | STRING | Mais de 600 colunas representando exatamente os cabeçalhos originais do Google Sheets. Não possui tipagem forte nem chaves primárias. |

### Tabela: `bronze_respostas_web`
*A nova porta de entrada do Data Lake. Recebe os dados brutos enviados pela API Node.js (formulário web) utilizando o padrão de armazenamento em dicionário (JSON) para máxima flexibilidade estrutural.*

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| **id_submissao** | STRING | Identificador único (UUID v4) gerado pela API no momento do recebimento. Chave de rastreabilidade primária. |
| **data_hora** | TIMESTAMP | Carimbo de tempo gerado automaticamente pelo BigQuery (`DEFAULT CURRENT_TIMESTAMP`) no momento da inserção. |
| **conteudo_bruto** | JSON | O payload (body) integral enviado pelo front-end, armazenado como um objeto vivo. Suporta evolução de schema sem necessidade de `ALTER TABLE`. |

---

## Camada de Staging (Modelos Internos dbt)
*Estas tabelas são modelos intermediários materializados como views no dataset `dbt_qualidadehsr`. Elas servem para preparar os dados brutos antes da unificação na Camada Silver.*

| Tabela | Função Técnica |
| :--- | :--- |
| **stg_bronze_respostas_web** | Realiza o *parsing* do campo JSON `conteudo_bruto`. Aqui as chaves do dicionário são transformadas em colunas tipadas. |
| **stg_bronze_legado_respostas** | Aplica a primeira camada de limpeza nos dados do Sheets e renomeia cabeçalhos técnicos para o padrão do projeto. |
| **stg_bronze_detalhes_respostas_web** | Expande (UNNEST) as respostas do formulário web para o formato vertical (EAV). |
| **stg_bronze_detalhes_respostas_legado** | Executa o UNPIVOT das 600+ colunas da planilha antiga utilizando a macro `dbt_utils.unpivot`. |

---

## Camada Silver & Padronização (Materializada pelo dbt)
Todas as tabelas desta camada são construídas e testadas exclusivamente pelo dbt. Os dados são extraídos do JSON da camada Bronze (Web) via funções de parsing (`JSON_VALUE`) e unificados com o histórico da Bronze (Legado), aplicando tipagem forte e padronização de nomenclaturas.

### Tabela: `silver_respostas`
*Tabela de cabeçalhos das auditorias. Contém os dados demográficos do paciente, identificação do auditor e metadados da submissão.*

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| id_resposta | STRING (MD5) | **Chave Primária (PK)**. Gerada via *Surrogate Key* (`dbt_utils.generate_surrogate_key`) combinando dados de origem. Garante unicidade absoluta e evita colisão de IDs entre o sistema Web (UUID) e o Legado. Protegida por testes de contrato (`unique`, `not_null`). |
| data_submissao | TIMESTAMP | **Campo de Partição**. Carimbo de data/hora de quando a auditoria foi registrada. |
| nome_empresa | STRING | **Campo de Cluster**. Nome da unidade hospitalar onde a auditoria foi realizada. |
| nome_avaliador | STRING | **Campo de Cluster**. Nome completo do profissional que realizou a auditoria. |
| data_avaliacao | DATETIME | Data da avaliação do prontuário inserida manualmente pelo auditor. |
| setor_avaliado | STRING | **Campo de Cluster**. Unidade/Setor interno do hospital (ex: UTI, Pronto Socorro). |
| numero_atendimento | STRING | Identificador único do atendimento do paciente no sistema MV/Prontuário. |
| tipo_prontuario | STRING | Define se o prontuário é Físico (avaliação prospectiva) ou Eletrônico (avaliação retrospectiva). |
| especialidade | STRING | Especialidade médica relacionada ao prontuário auditado. |
| tipo_avaliacao | STRING | **Campo de Cluster**. Categoria da auditoria (ex: Clínico, Cirúrgico, Obstétrico, etc). |

---

### Tabela: `silver_detalhes_respostas`
*Tabela detalhada no formato vertical (EAV). Cada linha representa uma resposta específica para uma pergunta de uma auditoria.*

| Coluna | Tipo | Chave | Descrição |
| :--- | :--- | :--- | :--- |
| id_detalhe | STRING (MD5) | **PK**. Identificador único da linha. Gerado pelo dbt combinando `id_resposta` + `nome_pergunta` após o processo de unpivot. Protegida por testes `unique` e `not_null`. |
| id_resposta | STRING | FK / Cluster | **Chave Estrangeira**. Liga este detalhe ao cabeçalho na tabela `silver_respostas`. |
| nome_pergunta | STRING | Cluster | O nome técnico da pergunta (conforme o payload JSON ou cabeçalho legado). |
| valor_resposta | STRING | - | O conteúdo da resposta (pode ser "Conforme", "Não Conforme", "N/A" ou o texto de uma observação). |

---

## Camada Gold & Consumo (Business Intelligence)

### Tabela (View): `gold_auditorias_consolidadas`
*Visão final unificada e otimizada para BI. Une cabeçalhos, respostas pivotadas e nomes amigáveis. Esta view implementa lógica de agregação binária para performance no Looker Studio.*

### Tabela (View): `gold_auditorias_consolidadas`
*Visão final unificada e otimizada para BI. Une cabeçalhos, respostas pivotadas e nomes amigáveis. Esta view implementa lógica de agregação binária para performance no Looker Studio.*

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| **id_auditoria** | STRING | Chave única da auditoria (MD5). Garante a rastreabilidade exata do formulário submetido. |
| **codigo_pergunta** | STRING | Código técnico raiz da pergunta avaliada (ex: `Q01_IDENTIFICACAO`). |
| **data_submissao** | TIMESTAMP | Data e hora em que o formulário de auditoria foi enviado e processado. |
| **nome_empresa** | STRING | Nome da unidade hospitalar onde a auditoria foi realizada. |
| **nome_avaliador** | STRING | Nome completo do profissional que realizou a auditoria. |
| **setor_avaliado** | STRING | Unidade ou setor interno do hospital auditado (ex: UTI, Pronto Socorro). |
| **especialidade** | STRING | Especialidade médica relacionada ao prontuário auditado. |
| **tipo_avaliacao** | STRING | Categoria macro da auditoria (ex: Clínico, Cirúrgico, Obstétrico). |
| **numero_atendimento** | STRING | Identificador único do atendimento do paciente no sistema de prontuário eletrônico (MV/Tasy). |
| **tipo_prontuario** | STRING | Define se o prontuário avaliado é Físico (papel) ou Eletrônico. |
| **tema_formatado** | STRING | Agrupamento lógico/fase da auditoria (ex: Identificação, Transporte, Alta). |
| **pergunta_formatada** | STRING | A pergunta escrita de forma clara e legível para exibição direta no dashboard. |
| **resposta** | STRING | Resultado da avaliação daquela pergunta específica: `Conforme`, `Não Conforme` ou `N/A`. |
| **observacao** | STRING | Comentários e justificativas. **Nota (LGPD):** Passa por filtro de mascaramento. Sequências como CPFs/Telefones aparecem como `[CENSURADO]`. |
| **qtde_conforme** | INTEGER | **Métrica FinOps (dbt):** Atribui `1` se a resposta for "Conforme" e `0` para qualquer outro valor. |
| **qtde_validos** | INTEGER | **Métrica FinOps (dbt):** Atribui `1` se a resposta for "Conforme" ou "Não Conforme". Atribui `0` para "N/A" (usado como denominador de taxas). |

---

### Tabela: `dim_perguntas` (Camada Gold / Dicionário Dimensional)
*Tabela dimensional gerada e atualizada automaticamente pelo pipeline em Python. Serve como o dicionário "De/Para" oficial.*

| Coluna | Tipo | Chave | Descrição |
| :--- | :--- | :--- | :--- |
| **codigo_base** | STRING | **PK** | O código técnico raiz da pergunta. Chave usada no JOIN com a tabela EAV. |
| **tipo_avaliacao** | STRING | - | A categoria macro do formulário (ex: Clínico, Cirúrgico). |
| **tema_formatado** | STRING | - | O agrupamento lógico/fase da auditoria (ex: Identificação, Transporte). |
| **pergunta_formatada** | STRING | - | O texto formatado da pergunta para exibição no dashboard. |