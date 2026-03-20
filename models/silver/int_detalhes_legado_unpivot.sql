{{config(materialized='table')}}
with unpivot_legado as(
    {{dbt_utils.unpivot(relation= ref('stg_bronze_legado_respostas'),
                                  cast_to= 'string',
                                  exclude= ['Timestamp',
                                            'nomeEmpresa',
                                            'nomeAvaliador',
                                            'dataAvaliacao',
                                            'setorAvaliado',
                                            'numAtendimento',
                                            'tipoProntuario',
                                            'especialidade',
                                            'tipoAvaliacao'],
                                  field_name= 'pergunta',
                                  value_name= 'resposta')}}
)
SELECT * FROM unpivot_legado