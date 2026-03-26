{{config(materialized='table',
         partition_by={
            "field": "data_submissao",
            "data_type": "timestamp",
            "granularity": "day"
         },
         cluster_by=["nome_empresa",
                     "tipo_avaliacao",
                     "setor_avaliado",
                     "especialidade"]
         )}}
with resposta as(
    select * from {{ref('silver_respostas')}}
),
detalhes as(
    select * from {{ref('silver_detalhes')}}
),
dicionario as(
    select * from {{ref('stg_bronze_dim_perguntas')}}
),
apenas_respostas as(
    select id_auditoria,
           replace(pergunta, '_Resp', '') as codigo_pergunta,
           resposta
    from detalhes
    where pergunta like '%_Resp'
),
apenas_observacoes as(
    select id_auditoria,
           replace(pergunta, '_Obs', '') as codigo_pergunta,
           resposta as observacao
    from detalhes
    where pergunta like '%_Obs'
),
detalhes_consolidados as(
    select r.id_auditoria,
           r.codigo_pergunta,
           r.resposta,
           o.observacao
    from apenas_respostas as r
    left join apenas_observacoes as o
    on r.id_auditoria = o.id_auditoria
    and r.codigo_pergunta = o.codigo_pergunta
),
fatos_com_nome as (
    select c.id_auditoria,
           c.codigo_pergunta,
           d.tema_formatado,
           d.pergunta_formatada,
           c.resposta,
           c.observacao
    from detalhes_consolidados as c
    left join dicionario as d
    on d.codigo_base = c.codigo_pergunta
),
consolidado_final as(
    select f.id_auditoria,
           f.codigo_pergunta,
           r.data_submissao,
           r.nome_empresa,
           r.nome_avaliador,
           r.setor_avaliado,
           r.especialidade,
           r.tipo_avaliacao,
           r.numero_atendimento,
           r.tipo_prontuario,
           f.tema_formatado,
           f.pergunta_formatada,
           f.resposta,
           REGEXP_REPLACE(COALESCE(f.observacao, 'Sem observações'), r'[0-9]{4,}','[CENSURADO]') as observacao,
           case when f.resposta = 'Conforme' then 1 else 0 end as qtde_conforme,
           case when f.resposta in ('Conforme', 'Não conforme') then 1 else 0 end as qtde_validos
    from fatos_com_nome as f
    left join resposta as r
    on f.id_auditoria = r.id_auditoria
)
select * from consolidado_final