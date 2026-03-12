CREATE OR REPLACE TABLE `comissao-prontuario.prontuarios_dados.respostas`
PARTITION BY DATE(data_submissao)
CLUSTER BY nome_empresa, tipo_avaliacao, nome_avaliador, setor_avaliado
AS
SELECT * FROM `comissao-prontuario.prontuarios_dados.resposta_bkp`;