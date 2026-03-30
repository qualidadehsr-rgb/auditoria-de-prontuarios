SELECT STRING_AGG(CONCAT("`",column_name, "`"),',')
FROM `comissao-prontuario.prontuarios_dados.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'bronze_legado_respostas' AND column_name NOT IN ("Timestamp'", "nomeEmpresa'",
"nomeAvaliador'", "dataAvaliacao'", "setorAvaliado'", "numAtendimento'", "tipoProntuario'",
"especialidade'", "tipoAvaliacao'")