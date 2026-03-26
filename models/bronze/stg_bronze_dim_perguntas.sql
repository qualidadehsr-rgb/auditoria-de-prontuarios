{{config(materialized='view')}}
select * from {{source('bronze', 'dim_perguntas')}}