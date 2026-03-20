{{config(materialized='table')}}
with source_data as(
    select * from {{source('bronze', 'bronze_legado_respostas')}}
)
select * from source_data