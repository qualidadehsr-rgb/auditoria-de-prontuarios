
CREATE OR REPLACE VIEW `comissao-prontuario.prontuarios_dados.gold_auditorias_consolidadas` AS
WITH detalhes_pivot AS(
  SELECT id_resposta,
       REPLACE(REPLACE(REPLACE(nome_pergunta, "_Resp",""), "_Obs", ""), "'", "") AS codigo_base,
       MAX(CASE WHEN nome_pergunta LIKE '%_Resp%' THEN valor_resposta END) AS resposta_conformidade,
       MAX(CASE WHEN nome_pergunta LIKE '%_Obs%' THEN valor_resposta END) AS observacao_texto
  FROM `comissao-prontuario.prontuarios_dados.detalhes_respostas`
  GROUP BY id_resposta, codigo_base
)
SELECT R.id_resposta,
       R.data_submissao,
       R.nome_empresa,
       R.nome_avaliador,
       R.setor_avaliado,
       D.tipo_avaliacao,
       D.tema_formatado,
       D. pergunta_formatada,
       P.resposta_conformidade,
       P.observacao_texto
FROM `comissao-prontuario.prontuarios_dados.respostas` AS R
INNER JOIN detalhes_pivot AS P ON R.id_resposta = P.id_resposta
LEFT JOIN `comissao-prontuario.prontuarios_dados.dim_perguntas` AS D ON P.codigo_base = D.codigo_base