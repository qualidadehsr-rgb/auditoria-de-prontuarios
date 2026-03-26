with source_data as(
    select * from {{source('bronze', 'bronze_respostas_web')}}
)
select id_submissao,
       data_hora,
       json_value(conteudo_bruto, '$.nomeEmpresa') as nome_empresa,
       json_value(conteudo_bruto, '$.nomeAvaliador') as nome_avaliador,
       json_value(conteudo_bruto, '$.dataAvaliacao') as data_avaliacao,
       json_value(conteudo_bruto, '$.setorAvaliado') as setor_avaliado,
       json_value(conteudo_bruto, '$.numAtendimento') as numero_atendimento,
       json_value(conteudo_bruto, '$.tipoProntuario') as tipo_prontuario,
       json_value(conteudo_bruto, '$.especialidade') as especialidade,
       json_value(conteudo_bruto, '$.tipoAvaliacao') as tipo_avaliacao
from source_data