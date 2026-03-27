{{config(materialized='view')}}
select codigo_base,
       tipo_avaliacao,
       tema_formatado,
       pergunta_formatada
from {{source('bronze', 'dim_perguntas')}}