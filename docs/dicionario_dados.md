# Dicionário de Dados

## Camada Bronze & Origem de Dados

### Tabela: `bronze_legado_respostas`
*O nosso Data Lake imutável. Esta tabela armazena o histórico bruto, atuando como um espelho de segurança da base original. Nenhuma limpeza ou regra de negócio é aplicada aqui.*

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| **Timestamp** | TIMESTAMP | Carimbo exato de data/hora gerado pelo sistema no momento da submissão do formulário. |
| **(Colunas do Formulário)** | STRING | Mais de 600 colunas representando exatamente os cabeçalhos originais do Google Sheets (ex: `nomeEmpresa'`, `Clinico_Id_NomeCompleto_Resp'`, etc.). Não possui tipagem forte nem chaves primárias. |


## Tabela: silver_respostas
*Tabela de cabeçalhos das auditorias. Contém os dados demográficos do paciente, identificação do auditor e metadados da submissão.*

| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| id_resposta | UUID | Chave primária (PK). Gerada automaticamente via `GENERATE_UUID()`. |
| data_submissao | TIMESTAMP | **Campo de Partição**. Carimbo de data/hora automático do sistema (Google Sheets). Inalterável. |
| nome_empresa | STRING | **Campo de Cluster**. Nome da unidade hospitalar onde a auditoria foi realizada. |
| nome_avaliador | STRING | **Campo de Cluster**. Nome completo do profissional que realizou a auditoria. |
| data_avaliacao | DATETIME | Data da avaliação do prontuário inserida manualmente pelo auditor. |
| setor_avaliado | STRING | **Campo de Cluster**. Unidade/Setor interno do hospital (ex: UTI, Pronto Socorro). |
| numero_atendimento | STRING | Identificador único do atendimento do paciente no sistema MV/Prontuário. |
| tipo_prontuario | STRING | Define se o prontuário é Físico (avaliação prospectiva), Eletrônico (avaliação retrospectiva). |
| especialidade | STRING | Especialidade médica relacionada ao prontuário auditado. |
| tipo_avaliacao | STRING | **Campo de Cluster**. Categoria da auditoria (ex: Clínico, Cirúrgico, Obstétrico, etc). |

## Tabela: silver_detalhes_respostas
*Tabela detalhada no formato vertical (EAV). Cada linha representa uma resposta específica para uma pergunta de uma auditoria.*

| Coluna | Tipo | Chave | Descrição |
| :--- | :--- | :--- | :--- |
| id_detalhe | STRING | PK | Identificador único da linha. Gerado via `GENERATE_UUID()`. |
| id_resposta | STRING | FK / Cluster | **Chave Estrangeira**. Liga este detalhe ao cabeçalho na tabela silver_respostas. |
| nome_pergunta | STRING | Cluster | O nome técnico da pergunta (conforme o cabeçalho original da planilha). |
| valor_resposta | STRING | - | O conteúdo da resposta (pode ser "Conforme", "Não Conforme" ou o texto de uma observação). |

## Tabela (View): gold_auditorias_consolidadas
*Visão final unificada. Une cabeçalhos, respostas pivotadas e nomes amigáveis das perguntas. É a fonte de dados oficial para os dashboards.*

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
| observacao_texto | `silver_detalhes_respostas` | Comentários e justificativas inseridos pelo auditor para aquela pergunta. |


## Tabela: `dim_perguntas` (Camada Gold / Dicionário Dimensional)
*Tabela dimensional gerada e atualizada automaticamente pelo pipeline em Python (via GitHub Actions). Serve como o dicionário "De/Para", traduzindo os códigos técnicos do formulário para nomes legíveis e amigáveis que o utilizador final consome no dashboard.*

| Coluna | Tipo | Chave | Descrição |
| :--- | :--- | :--- | :--- |
| **codigo_base** | STRING | **PK** | O código técnico raiz da pergunta, extraído do cabeçalho original sem os sufixos `_Resp` ou `_Obs` (ex: `Clinico_Id_NomeCompleto`). É a chave usada no JOIN com a tabela EAV. |
| **tipo_avaliacao** | STRING | - | A categoria macro do formulário à qual a pergunta pertence (ex: Clínico, Cirúrgico, Obstétrico). |
| **tema_formatado** | STRING | - | O agrupamento lógico/fase da auditoria (ex: Identificação, Transporte, Reconciliação, Alta). |
| **pergunta_formatada** | STRING | - | O texto limpo, claro e formatado da pergunta para exibição nos relatórios e Looker Studio. |

---

### Tabela Externa: `dados_legado_sheets`
*Ponte de ligação (Tabela Federada/Externa). Não consome armazenamento físico no BigQuery.*

| Atributo | Valor | Descrição |
| :--- | :--- | :--- |
| **Tipo de Tabela** | EXTERNAL | Conectada diretamente ao URI do Google Sheets. |
| **Finalidade** | Ingestão Contínua | Serve exclusivamente como "tubo de passagem" para que as Consultas Programadas (Scheduled Queries) do BigQuery leiam as novas respostas em tempo real e gravem fisicamente na tabela `bronze_legado_respostas`. |