/*with legado as(
    select timestamp as data_hora,
           nomeEmpresa as nome_empresa,
           nomeAvaliador as nome_avaliador,
           dataAvaliacao as data_avaliacao,
           setorAvaliado as setor_avaliado,
           numAtendimento as numero_atendimento,
           tipoProntuario as tipo_prontuario,
           tipoAvaliacao as tipo_avaliacao,
           pergunta,
           resposta,
           especialidade,
           CAST(NULL AS STRING) as id_submissao
    from {{ref('int_detalhes_legado_unpivot')}}
),
web as(
    select CAST(data_hora AS STRING),
           nome_empresa,
           nome_avaliador,
           data_avaliacao,
           setor_avaliado,
           numero_atendimento,
           tipo_prontuario,
           tipo_avaliacao,
           pergunta,
           resposta,
           especialidade,
           id_submissao      
    from {{ref('stg_bronze_respostas_web')}}
)
select * from legado
union all
select * from web*/