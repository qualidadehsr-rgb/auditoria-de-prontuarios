{%set colunas = adapter.get_columns_in_relation(source('bronze', 'bronze_legado_respostas'))%}
with source_data as(
    select {% for col in colunas%}
       `{{col.name}}` as `{{col.name | replace("'", "") |
                                       replace("é", "e") |
                                       replace("ç", "c") |
                                       replace("ã", "a") |
                                       replace("&", "_")}}`
        {%if not loop.last%}, {%endif%}           
    {% endfor %}
    from {{source('bronze', 'bronze_legado_respostas')}}
)
--SELECT * mantido intencionalmente: tabela legado com 600+ colunas dinâmicas que alimentam o unpivot
select * from source_data