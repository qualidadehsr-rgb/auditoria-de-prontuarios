with source_data as(
    select * from {{source('bronze', 'bronze_respostas_web')}}
)
select id_submissao, json_value(conteudo_bruto, '$.nome_empresa', '$.numero_atendimento') from source_data