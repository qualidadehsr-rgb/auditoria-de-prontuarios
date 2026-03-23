{{config(materialized='table')}}
with respostas_web as(
    select id_submissao as id_auditoria,
           data_hora,
           nome_empresa,
           nome_avaliador,
           data_avaliacao,
           setor_avaliado,
           numero_atendimento,
           tipo_prontuario,
           especialidade,
           tipo_avaliacao,
           'web' as origem_sistema
    from {{ref('stg_bronze_respostas_web')}}
),
respostas_legado as(
    select {{dbt_utils.generate_surrogate_key(['numAtendimento', 'Timestamp'])}} as id_auditoria,
           parse_timestamp('%d/%m/%Y %H:%M:%S', replace(Timestamp, ',','')) as data_hora,
           nomeEmpresa as nome_empresa,
           nomeAvaliador as nome_avaliador,
           dataAvaliacao as data_avaliacao,
           setorAvaliado as setor_avaliado,
           numAtendimento as numero_atendimento,
           tipoProntuario as tipo_prontuario,
           especialidade,
           tipoAvaliacao as tipo_avaliacao,
           'legado' as origem_sistema
    from {{ref('stg_bronze_legado_respostas')}}
)
select * from respostas_web
union all
select * from respostas_legado