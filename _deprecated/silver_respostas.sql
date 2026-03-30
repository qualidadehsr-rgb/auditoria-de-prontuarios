MERGE `comissao-prontuario.prontuarios_dados.silver_respostas` AS T
USING(

WITH base_respostas AS (
  SELECT GENERATE_UUID() AS id_resposta,
    SAFE.PARSE_TIMESTAMP('%d/%m/%Y, %H:%M:%S',`Timestamp'`) AS data_submissao,
    `nomeEmpresa'` AS nome_empresa,
    `nomeAvaliador'`AS nome_avaliador,
    SAFE_CAST(`dataAvaliacao'` AS DATETIME) AS data_avaliacao,
    `setorAvaliado'`AS setor_avaliado,
    SAFE_CAST(`numAtendimento'` AS STRING) AS numero_atendimento,
    `tipoProntuario'`As tipo_prontuario,
    `especialidade'`AS especialidade,
    `tipoAvaliacao'`AS tipo_avaliacao,
    ROW_NUMBER() OVER(
      PARTITION BY `setorAvaliado'`, `numAtendimento'`, `nomeAvaliador'`, `tipoProntuario'`
      ORDER BY `Timestamp'` DESC
    ) AS ranking_duplicidade
    FROM `comissao-prontuario.prontuarios_dados.bronze_legado_respostas`
)
SELECT * EXCEPT(ranking_duplicidade) FROM base_respostas
WHERE ranking_duplicidade = 1
) AS S
ON T.numero_atendimento = S.numero_atendimento
AND T.nome_avaliador = S.nome_avaliador
AND T.setor_avaliado = S.setor_avaliado
AND T.tipo_prontuario = S.tipo_prontuario
WHEN NOT MATCHED THEN
INSERT ROW;