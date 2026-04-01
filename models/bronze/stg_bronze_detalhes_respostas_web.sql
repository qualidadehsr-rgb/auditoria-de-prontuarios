with tabela_base as(
SELECT id_submissao, conteudo_bruto
FROM {{source('bronze','bronze_respostas_web')}}

)
SELECT id_submissao, REGEXP_REPLACE(REGEXP_REPLACE(NORMALIZE(pergunta, NFD), r'\pM',''), r'&', '_') as pergunta, string(conteudo_bruto[pergunta]) as resposta
FROM tabela_base, UNNEST(regexp_extract_all(to_json_string(conteudo_bruto), r'"([^"]+)":')) as pergunta
where pergunta like '%_Resp' or pergunta like '%_Obs'

