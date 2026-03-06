WITH base_respostas AS (
  SELECT GENERATE_UUID() AS id_resposta,
    SAFE.PARSE_TIMESTAMP('%d/%m/%Y, %H:%M:%S',`Timestamp'`) AS data_submissao,
    `nomeEmpresa'` AS nome_empresa,
    `nomeAvaliador'`AS nome_avaliador,
    `setorAvaliado'`AS setor_avaliado,
    `tipoProntuario'`As tipo_prontuario,
    `especialidade'`AS especialidade,
    `tipoAvaliacao'`AS tipo_avaliacao,
    SAFE_CAST(`dataAvaliacao'` AS DATE) AS data_avaliacao,
    SAFE_CAST(`numAtendimento'` AS STRING) AS numero_atendimento,
    ROW_NUMBER() OVER(
      PARTITION BY `setorAvaliado'`, `numAtendimento'`, `nomeAvaliador'`
      ORDER BY `Timestamp'` DESC
    ) AS ranking_duplicidade
    FROM `comissao-prontuario.prontuarios_dados.bronze_legado_respostas`
)
SELECT * EXCEPT(ranking_duplicidade) FROM base_respostas
WHERE ranking_duplicidade = 1;