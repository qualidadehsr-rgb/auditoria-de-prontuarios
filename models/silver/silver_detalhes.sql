{{config(materialized='table')}}
with detalhes_web as(
    select id_submissao as id_auditoria,
           pergunta,
           resposta,
           'web' as origem_sistema
    from {{ref('stg_bronze_detalhes_respostas_web')}}
),
detalhes_legado as(
    select {{dbt_utils.generate_surrogate_key(['numAtendimento', 'Timestamp'])}} as id_auditoria,
           pergunta,
           resposta,
           'legado' as origem_sistema
    from {{ref('stg_bronze_detalhes_respostas_legado')}}
)
select * from detalhes_web
union all
select * from detalhes_legado
