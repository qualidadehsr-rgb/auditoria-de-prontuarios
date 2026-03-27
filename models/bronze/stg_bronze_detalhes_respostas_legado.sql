{% set source_relation = ref('stg_bronze_legado_respostas') %}
{% set columns = adapter.get_columns_in_relation(source_relation) %}

{% set colunas_metadados = ['numAtendimento', 'Timestamp', 'nomeEmpresa',
                           'nomeAvaliador', 'dataAvaliacao', 'setorAvaliado',
                           'tipoProntuario', 'especialidade', 'tipoAvaliacao'] %}

{% set colunas_respostas = [] %}

{% for col in columns %}
  {% if col.name not in colunas_metadados and (col.name.endswith('_Resp') or col.name.endswith('_Obs')) %}
    {% do colunas_respostas.append(col.name) %}
  {% endif %}
{% endfor %}

select numAtendimento,
       `Timestamp`,
       resposta,
       pergunta
from {{ source_relation }}
unpivot(
    resposta for pergunta in (
        {% for col in colunas_respostas %}
           `{{ col }}`{% if not loop.last %},{% endif %}
        {% endfor %}
    )
)
where resposta is not null and trim(resposta) != ''