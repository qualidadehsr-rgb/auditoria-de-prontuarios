# ADR 0011: Mascaramento de Dados Sensíveis (LGPD) na Camada Gold e Front-end

## Status
Aceito

## Data
13 de Março de 2026

## Contexto e Problema
Com a adoção do sistema por múltiplos auditores, identificamos o risco de exposição de Dados Pessoais Identificáveis (PII) e Dados Sensíveis de Saúde. O maior ponto de vulnerabilidade reside no campo de texto livre (`observacao_texto`), onde o auditor poderia, inadvertidamente, digitar o nome do paciente, CPF ou número do prontuário, violando as diretrizes da Lei Geral de Proteção de Dados (LGPD).

Ferramentas nativas de nuvem, como o Google Cloud DLP (Data Loss Prevention), conseguem identificar e mascarar nomes próprios via Inteligência Artificial, porém possuem um custo de processamento por Gigabyte que inviabiliza a premissa de FinOps (custo zero) do projeto atual.

## Decisão Arquitetural
Decidi implementar uma **abordagem híbrida de barreira dupla (Privacy by Design)**, com custo operacional zero:

1. **Governança na Origem (UX/Front-end):** Alteração do *placeholder* do campo de observação no arquivo `Pagina2_Template.html` para incluir um aviso visual explícito: *"LGPD: Não insira o nome do paciente!"*. Isso atua como um "Nudge" comportamental, educando o auditor no momento da inserção.
2. **Censor Matemático (Data Warehouse):** Na Camada Gold (`gold_view_consolidada.sql`), apliquei a função `REGEXP_REPLACE` na coluna de texto livre para buscar padrões de 4 ou mais números consecutivos (`r'[0-9]{4,}'`). Qualquer documento (CPF, RG, Telefone, Matrícula) inserido por engano é substituído dinamicamente pela string `[CENSURADO]` no momento da leitura (Query).

## Consequências

### Positivas:
* **FinOps:** Proteção de dados implementada 100% via código e regras de negócio, sem custos extras de serviços gerenciados de IA/DLP.
* **Educação Contínua:** O aviso no front-end ajuda na conscientização da equipe de auditores sobre a LGPD.
* **Segurança no BI:** O Looker Studio e seus consumidores finais ficam isolados de dados numéricos sensíveis de pacientes.

### Negativas/Atenção:
* O mascaramento via Regex (`[0-9]{4,}`) protege apenas documentos numéricos. Se o auditor ignorar o aviso visual e digitar um nome próprio em texto (ex: "O paciente João..."), a view SQL não conseguirá mascarar o dado, pois não há análise de contexto semântico.

* **Nota (março/2026):** Durante a migração das views manuais para o dbt, o mascaramento foi temporariamente perdido. Restaurado no modelo gold_auditorias_consolidadas.sql com o mesmo padrão regex original.