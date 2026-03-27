--resultados binarios para calculo da taxa de conformidade
{% macro flag_conformidade(column) %}
  CASE WHEN {{ column }} = 'Conforme' THEN 1 ELSE 0 END
{% endmacro %}

{% macro flag_valido(column) %}
  CASE WHEN {{ column }} IN ('Conforme', 'Não conforme') THEN 1 ELSE 0 END
{% endmacro %}