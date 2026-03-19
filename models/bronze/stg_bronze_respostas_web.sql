with source_data as(
    select * from {{source('bronze', 'bronze_respostas_web')}}
)
select * from source_data