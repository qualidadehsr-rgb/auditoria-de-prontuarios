{{config(materialized='table',
         partition_by={
            "field": "data_submissao",
            "data_type": "timestamp",
            "granularity": "day"
         }
         )}}
with respostas_web as(
    select id_submissao as id_auditoria,
           data_hora as data_submissao,
           nome_empresa,
           nome_avaliador,
           data_avaliacao,
           coalesce(nullif(trim(setor_avaliado),''), 'Não informado') as setor_avaliado,
           numero_atendimento,
           tipo_prontuario,
           coalesce(nullif(trim(especialidade),''), 'Não informado') as especialidade,
           tipo_avaliacao,
           'web' as origem_sistema
    from {{ref('stg_bronze_respostas_web')}}
),
respostas_legado as(
    select {{dbt_utils.generate_surrogate_key(['numAtendimento', 'Timestamp'])}} as id_auditoria,
           parse_timestamp('%d/%m/%Y %H:%M:%S', replace(Timestamp, ',','')) as data_submissao,
           nomeEmpresa as nome_empresa,
           nomeAvaliador as nome_avaliador,
           dataAvaliacao as data_avaliacao,
           coalesce(nullif(trim(setorAvaliado),''), 'Não informado') as setor_avaliado,
           numAtendimento as numero_atendimento,
           tipoProntuario as tipo_prontuario,
           coalesce(nullif(trim(especialidade),''), 'Não informado') as especialidade,
           tipoAvaliacao as tipo_avaliacao,
           'legado' as origem_sistema
    from {{ref('stg_bronze_legado_respostas')}}
)
select * from respostas_web
union all
select * from respostas_legado