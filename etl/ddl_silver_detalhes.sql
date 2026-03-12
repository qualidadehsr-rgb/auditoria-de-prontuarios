CREATE OR REPLACE TABLE `comissao-prontuario.prontuarios_dados.silver_detalhes_respostas`
CLUSTER BY id_resposta, nome_pergunta
AS
SELECT * FROM `comissao-prontuario.prontuarios_dados.detalhes_respostas_bkp`;