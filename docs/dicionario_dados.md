# Dicionário de Dados

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

## Camada Silver & Padronização

### Tabela: `silver_respostas`
*Tabela de cabeçalhos das auditorias. Contém os dados demográficos do paciente, identificação do auditor e metadados da submissão.*

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| id_resposta | UUID | Chave primária (PK). Gerada automaticamente via `GENERATE_UUID()` ou herdada da API. |
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
| id_detalhe | STRING | PK | Identificador único da linha. Gerado via `GENERATE_UUID()` ou herdado da API. |
| id_resposta | STRING | FK / Cluster | **Chave Estrangeira**. Liga este detalhe ao cabeçalho na tabela `silver_respostas`. |
| nome_pergunta | STRING | Cluster | O nome técnico da pergunta (conforme o payload JSON ou cabeçalho legado). |
| valor_resposta | STRING | - | O conteúdo da resposta (pode ser "Conforme", "Não Conforme", "N/A" ou o texto de uma observação). |

---

## Camada Gold & Consumo (Business Intelligence)

### Tabela (View): `gold_auditorias_consolidadas`
*Visão final unificada e otimizada para BI. Une cabeçalhos, respostas pivotadas e nomes amigáveis. Esta view implementa lógica de agregação binária para performance no Looker Studio.*

| Coluna | Origem | Descrição |
| :--- | :--- | :--- |
| id_resposta | `silver_respostas` | ID único da auditoria (chave de rastreabilidade). |
| data_submissao | `silver_respostas` | Data/Hora em que o formulário foi enviado. |
| nome_empresa | `silver_respostas` | Unidade Hospitalar. |
| nome_avaliador | `silver_respostas` | Nome do auditor. |
| setor_avaliado | `silver_respostas` | Setor do hospital auditado. |
| tipo_avaliacao | `dim_perguntas` | Categoria do checklist (ex: Clínico, Cirúrgico). |
| tema_formatado | `dim_perguntas` | Agrupamento das perguntas (ex: Identificação, Transporte, Alta). |
| pergunta_formatada | `dim_perguntas` | A pergunta escrita de forma clara e legível para o relatório. |
| resposta_conformidade | `silver_detalhes_respostas` | Resultado da avaliação: Conforme, Não Conforme ou N/A. |
| **qtde_conforme** | **Cálculo (SQL)** | **Métrica FinOps**: Atribui 1 se a resposta for "Conforme" e 0 para qualquer outro valor. |
| **qtde_valida** | **Cálculo (SQL)** | **Métrica FinOps**: Atribui 1 se a resposta for "Conforme" ou "Não Conforme". Atribui 0 para "N/A", servindo como denominador da taxa de conformidade. |
| observacao_texto | `silver_detalhes_respostas` | Comentários e justificativas inseridos pelo auditor para aquela pergunta. |

---

### Tabela: `dim_perguntas` (Camada Gold / Dicionário Dimensional)
*Tabela dimensional gerada e atualizada automaticamente pelo pipeline em Python. Serve como o dicionário "De/Para" oficial.*

| Coluna | Tipo | Chave | Descrição |
| :--- | :--- | :--- | :--- |
| **codigo_base** | STRING | **PK** | O código técnico raiz da pergunta. Chave usada no JOIN com a tabela EAV. |
| **tipo_avaliacao** | STRING | - | A categoria macro do formulário (ex: Clínico, Cirúrgico). |
| **tema_formatado** | STRING | - | O agrupamento lógico/fase da auditoria (ex: Identificação, Transporte). |
| **pergunta_formatada** | STRING | - | O texto formatado da pergunta para exibição no dashboard. |