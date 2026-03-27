--limpeza de strings
{% macro clean_empty_string(column, default_value='Não informado') %}
  COALESCE(NULLIF(TRIM({{ column }}), ''), '{{ default_value }}')
{% endmacro %}