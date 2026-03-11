CREATE OR REPLACE TABLE `comissao-prontuario.prontuarios_dados.dim_perguntas`AS
WITH lista_perguntas AS(
  SELECT DISTINCT
  REPLACE(REPLACE(nome_pergunta, "_Resp", ""), "_Obs", "") AS codigo_base
  FROM `comissao-prontuario.prontuarios_dados.detalhes_respostas`
),
quebra_matriz AS(
  SELECT codigo_base,
         SPLIT(codigo_base, '_') AS partes
  FROM lista_perguntas
)
SELECT codigo_base,
       partes[SAFE_OFFSET(0)] AS tipo_avaliacao,
       CASE WHEN ARRAY_LENGTH(partes) = 2 THEN 'Geral'
       ELSE CASE partes[SAFE_OFFSET(1)]
                WHEN 'Id' THEN 'Identificação do Paciente'
                WHEN 'Triagem' THEN 'Triagem'
                WHEN 'HDA' THEN 'Histórico da Doença Atual'
                WHEN 'Reconciliacao' THEN 'Reconciliação Medicamentosa'
                WHEN 'Transporte' THEN 'Transporte Seguro - SBAR'
                WHEN 'TEV' THEN 'Tromboembolismo Venoso (TEV)'
                WHEN 'SAE' THEN 'Sistematização da Assistência de Enfermagem (SAE)'
                WHEN 'Riscos' THEN 'Avaliação de Riscos'
                WHEN 'PlanoMedico' THEN 'Plano Terapêutico Médico'
                WHEN 'PlanoMulti' THEN 'Plano Terapêutico Multidisciplinar'
                WHEN 'PlanoCuidado' THEN 'Plano de Cuidado Paciente e Família'
                WHEN 'EvolucaoEnf' THEN 'Evolução de Enfermagem'
                WHEN 'AnotacaoEnf' THEN 'Anotação de Enfermagem'
                WHEN 'EvolucaoMedica' THEN 'Evolução Médica'
                WHEN 'Eventos' THEN 'Eventos Adversos'
                WHEN 'Alta' THEN 'Sumário de Alta'
                WHEN 'Final' THEN 'Siglas'
                WHEN 'Suicidio' THEN 'Avaliação de Risco de Suicídio'
                WHEN 'Protocolos' THEN 'Protocolos Gerenciados'
                WHEN 'TCLE' THEN 'Termos de Consentimento (TCLE)'
                WHEN 'ConsultaPre' THEN 'Consulta Pré-Anestésica'
                WHEN 'Boletim' THEN 'Boletim Anestésico'
                WHEN 'Checklist' THEN 'Check List Cirurgia/Parto Seguro'
                WHEN 'Parto' THEN 'Check List de Parto Seguro'
                WHEN 'EvolucaoAdulto' THEN 'Evolução Adulto'
                WHEN 'EvolucaoPed' THEN 'Evolução Pediátrica'
                WHEN 'Orelhinha' THEN 'Teste da Orelhinha'
                WHEN 'Testes' THEN 'Testes'
                ELSE partes[SAFE_OFFSET(1)] 
            END
        END AS tema_formatado,
        REGEXP_REPLACE(CASE WHEN ARRAY_LENGTH(partes) <= 2 THEN partes[SAFE_OFFSET(1)] ELSE partes[SAFE_OFFSET(2)] END, r'([a-z])([A-Z])', r'\1 \2') AS pergunta_formatada
FROM quebra_matriz;