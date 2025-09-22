const express = require('express');
const { google } = require('googleapis');

const app = express();

// ===================================================================
// CONFIGURAÇÃO PRINCIPAL - Ação Obrigatória
// Encontre o ID na URL da sua planilha: docs.google.com/spreadsheets/d/AQUI_FICA_O_ID/edit
const SPREADSHEET_ID = '106XMiyQsje4ikigPEvlDc4KZhKNs4tpVSnMxjTcET0A';
// ===================================================================

// Configurações do servidor
app.use(express.json());
app.use(express.static('public'));


// ===================================================================
// API #1: BUSCAR OPÇÕES DINÂMICAS (NOVA)
// Esta rota lê a aba "Configuracao" e envia as listas para o formulário.
// ===================================================================
app.get('/api/get-options', async (req, res) => {
  try {
    const empresa = req.query.empresa;
    if (!empresa) {
      return res.status(400).json({ message: 'Nome da empresa é obrigatório.' });
    }

    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: 'https://www.googleapis.com/auth/spreadsheets.readonly', // Apenas permissão de leitura é necessária aqui
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Lê os dados da aba 'Configuracao'
    const range = 'Configuracao!A:C';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });

    const allOptions = response.data.values || [];
    const options = {
      setores: [],
      especialidades: []
    };

    // Filtra os dados para retornar apenas os da empresa selecionada
    allOptions.forEach(row => {
      if (row[0] === empresa) { // Se a coluna 'Empresa' for a correta...
        if (row[1] === 'Setor') {
          options.setores.push(row[2]);
        } else if (row[1] === 'Especialidade') {
          options.especialidades.push(row[2]);
        }
      }
    });

    res.status(200).json(options);

  } catch (error) {
    console.error('Erro ao buscar opções:', error);
    res.status(500).json({ message: 'Erro ao buscar opções da planilha.' });
  }
});


// ===================================================================
// API #2: SALVAR DADOS DO FORMULÁRIO (EXISTENTE)
// Esta rota recebe os dados completos e os salva na aba "Respostas".
// ===================================================================
app.post('/api/salvar-dados', async (req, res) => {
  try {
    const dadosFormulario = req.body;
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: 'https://www.googleapis.com/auth/spreadsheets', // Permissão de escrita necessária aqui
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const ordemDasColunas = ['Timestamp','nomeEmpresa','nomeAvaliador','dataAvaliacao','setorAvaliado','numAtendimento','tipoProntuario','especialidade','tipoAvaliacao','Clinico_Id_NomeCompleto_Resp','Clinico_Id_NomeCompleto_Obs','Clinico_Id_DataNasc_Resp','Clinico_Id_DataNasc_Obs','Clinico_Id_Sexo_Resp','Clinico_Id_Sexo_Obs','Clinico_Id_NomeMae_Resp','Clinico_Id_NomeMae_Obs','Clinico_Id_Endereco_Resp','Clinico_Id_Endereco_Obs','Clinico_Triagem_Realizada_Resp','Clinico_Triagem_Realizada_Obs','Clinico_Triagem_ClassificacaoCorreta_Resp','Clinico_Triagem_ClassificacaoCorreta_Obs','Clinico_HDA_QuadroClinico_Resp','Clinico_HDA_QuadroClinico_Obs','Clinico_HDA_CondutaMedica_Resp','Clinico_HDA_CondutaMedica_Obs','Clinico_HDA_ExameFisico_Resp','Clinico_HDA_ExameFisico_Obs','Clinico_HDA_SinalComorbidades_Resp','Clinico_HDA_SinalComorbidades_Obs','Clinico_HDA_SinalAlergias_Resp','Clinico_HDA_SinalAlergias_Obs','Clinico_HDA_HipoteseDiagnostica_Resp','Clinico_HDA_HipoteseDiagnostica_Obs','Clinico_HDA_ExamesComplementares_Resp','Clinico_HDA_ExamesComplementares_Obs','Clinico_Reconciliacao_MedsUso_Resp','Clinico_Reconciliacao_MedsUso_Obs','Clinico_Reconciliacao_HorarioDose_Resp','Clinico_Reconciliacao_HorarioDose_Obs','Clinico_Reconciliacao_Frequencia_Resp','Clinico_Reconciliacao_Frequencia_Obs','Clinico_Reconciliacao_SinalAlergias_Resp','Clinico_Reconciliacao_SinalAlergias_Obs','Clinico_Reconciliacao_ManterMed_Resp','Clinico_Reconciliacao_ManterMed_Obs','Clinico_Transporte_Diagnostico_Resp','Clinico_Transporte_Diagnostico_Obs','Clinico_Transporte_SinalAlergias_Resp','Clinico_Transporte_SinalAlergias_Obs','Clinico_Transporte_SinalPrecaucoes_Resp','Clinico_Transporte_SinalPrecaucoes_Obs','Clinico_Transporte_MotivoTransferencia_Resp','Clinico_Transporte_MotivoTransferencia_Obs','Clinico_Transporte_UnidadeOrigem_Resp','Clinico_Transporte_UnidadeOrigem_Obs','Clinico_Transporte_UnidadeDestino_Resp','Clinico_Transporte_UnidadeDestino_Obs','Clinico_Transporte_IdRiscos_Resp','Clinico_Transporte_IdRiscos_Obs','Clinico_Transporte_SSVVAtualizado_Resp','Clinico_Transporte_SSVVAtualizado_Obs','Clinico_Transporte_Criterios_Resp','Clinico_Transporte_Criterios_Obs','Clinico_Transporte_RecomendacoesPreenchidas_Resp','Clinico_Transporte_RecomendacoesPreenchidas_Obs','Clinico_TEV_Avaliacao24h_Resp','Clinico_TEV_Avaliacao24h_Obs','Clinico_TEV_PrescricaoProtocolo_Resp','Clinico_TEV_PrescricaoProtocolo_Obs','Clinico_TEV_ReavaliacaoEnfermagem_Resp','Clinico_TEV_ReavaliacaoEnfermagem_Obs','Clinico_SAE_HistoricoEnf_Resp','Clinico_SAE_HistoricoEnf_Obs','Clinico_SAE_DiagnosticoEnf_Resp','Clinico_SAE_DiagnosticoEnf_Obs','Clinico_SAE_CuidadosPrescritos_Resp','Clinico_SAE_CuidadosPrescritos_Obs','Clinico_Riscos_AvaliacaoQueda_Resp','Clinico_Riscos_AvaliacaoQueda_Obs','Clinico_Riscos_AvaliacaoLesaoPele_Resp','Clinico_Riscos_AvaliacaoLesaoPele_Obs','Clinico_Riscos_AvaliacaoBroncoaspiracao_Resp','Clinico_Riscos_AvaliacaoBroncoaspiracao_Obs','Clinico_PlanoMedico_BemDefinido_Resp','Clinico_PlanoMedico_BemDefinido_Obs','Clinico_PlanoMulti_Existente_Resp','Clinico_PlanoMulti_Existente_Obs','Clinico_PlanoMulti_Metas_Resp','Clinico_PlanoMulti_Metas_Obs','Clinico_PlanoMulti_Reavaliacao_Resp','Clinico_PlanoMulti_Reavaliacao_Obs','Clinico_PlanoMulti_TodasCategorias_Resp','Clinico_PlanoMulti_TodasCategorias_Obs','Clinico_PlanoCuidado_InfoRelevante_Resp','Clinico_PlanoCuidado_InfoRelevante_Obs','Clinico_EvolucaoEnf_InfoClara_Resp','Clinico_EvolucaoEnf_InfoClara_Obs','Clinico_AnotacaoEnf_InfoClara_Resp','Clinico_AnotacaoEnf_InfoClara_Obs','Clinico_EvolucaoMedica_InfoClara_Resp','Clinico_EvolucaoMedica_InfoClara_Obs','Clinico_Eventos_Identificado_Resp','Clinico_Eventos_Identificado_Obs','Clinico_Eventos_Notificado_Resp','Clinico_Eventos_Notificado_Obs','Clinico_Alta_Sumario_Resp','Clinico_Alta_Sumario_Obs','Clinico_Alta_Orientacoes_Resp','Clinico_Alta_Orientacoes_Obs','Clinico_Alta_Especialidade_Resp','Clinico_Alta_Especialidade_Obs','Clinico_Final_UsoInadequadoSiglas_Resp','Clinico_Final_UsoInadequadoSiglas_Obs','Clinico_Suicidio_DocumentoAberto_Resp','Clinico_Suicidio_DocumentoAberto_Obs','Clinico_Suicidio_SinalizadoProtocolo_Resp','Clinico_Suicidio_SinalizadoProtocolo_Obs','Clinico_Suicidio_SinalizacaoBarreiras_Resp','Clinico_Suicidio_SinalizacaoBarreiras_Obs','Clinico_Suicidio_FormularioPreenchido_Resp','Clinico_Suicidio_FormularioPreenchido_Obs','Clinico_Suicidio_ParecerPsicologia_Resp','Clinico_Suicidio_ParecerPsicologia_Obs','Clinico_Suicidio_ParecerPsiquiatria_Resp','Clinico_Suicidio_ParecerPsiquiatria_Obs','Clinico_Protocolos_AtendimentoProtocolo_Resp','Clinico_Protocolos_AtendimentoProtocolo_Obs','Clinico_Protocolos_DocumentoPreenchido_Resp','Clinico_Protocolos_DocumentoPreenchido_Obs','Clinico_Protocolos_TempoRespeitado_Resp','Clinico_Protocolos_TempoRespeitado_Obs','Clinico_Protocolos_FalhasEvidenciadas_Resp','Clinico_Protocolos_FalhasEvidenciadas_Obs','Cirurgico_Id_NomePaciente_Resp','Cirurgico_Id_NomePaciente_Obs','Cirurgico_Id_DataNasc_Resp','Cirurgico_Id_DataNasc_Obs','Cirurgico_Id_Sexo_Resp','Cirurgico_Id_Sexo_Obs','Cirurgico_Id_NomeMae_Resp','Cirurgico_Id_NomeMae_Obs','Cirurgico_Id_Endereco_Resp','Cirurgico_Id_Endereco_Obs','Cirurgico_Triagem_Realizada_Resp','Cirurgico_Triagem_Realizada_Obs','Cirurgico_Triagem_ClassificacaoCorreta_Resp','Cirurgico_Triagem_ClassificacaoCorreta_Obs','Cirurgico_HDA_QuadroClinico_Resp','Cirurgico_HDA_QuadroClinico_Obs','Cirurgico_HDA_CondutaMedica_Resp','Cirurgico_HDA_CondutaMedica_Obs','Cirurgico_HDA_ExameFisico_Resp','Cirurgico_HDA_ExameFisico_Obs','Cirurgico_HDA_Comorbidades_Resp','Cirurgico_HDA_Comorbidades_Obs','Cirurgico_HDA_Alergias_Resp','Cirurgico_HDA_Alergias_Obs','Cirurgico_HDA_ExamesComplementares_Resp','Cirurgico_HDA_ExamesComplementares_Obs','Cirurgico_HDA_HipoteseDiagnostica_Resp','Cirurgico_HDA_HipoteseDiagnostica_Obs','Cirurgico_Reconciliacao_Medicacao_Uso_Resp','Cirurgico_Reconciliacao_Medicacao_Uso_Obs','Cirurgico_Reconciliacao_Dose_Resp','Cirurgico_Reconciliacao_Dose_Obs','Cirurgico_Reconciliacao_Frequencia_Resp','Cirurgico_Reconciliacao_Frequencia_Obs','Cirurgico_Reconciliacao_Medicacao_Mantida_Resp','Cirurgico_Reconciliacao_Medicacao_Mantida_Obs','Cirurgico_Transporte_Diagnostico_Resp','Cirurgico_Transporte_Diagnostico_Obs','Cirurgico_Transporte_SinalAlergias_Resp','Cirurgico_Transporte_SinalAlergias_Obs','Cirurgico_Transporte_Precaucoes_Resp','Cirurgico_Transporte_Precaucoes_Obs','Cirurgico_Transporte_MotivoTransferencia_Resp','Cirurgico_Transporte_MotivoTransferencia_Obs','Cirurgico_Transporte_UnidadeOrigem_Resp','Cirurgico_Transporte_UnidadeOrigem_Obs','Cirurgico_Transporte_UnidadeDestino_Resp','Cirurgico_Transporte_UnidadeDestino_Obs','Cirurgico_Transporte_IdRiscos_Resp','Cirurgico_Transporte_IdRiscos_Obs','Cirurgico_Transporte_SSVVAtualizado_Resp','Cirurgico_Transporte_SSVVAtualizado_Obs','Cirurgico_Transporte_Criterios_Resp','Cirurgico_Transporte_Criterios_Obs','Cirurgico_Transporte_RecomendacoesPreenchidas_Resp','Cirurgico_Transporte_RecomendacoesPreenchidas_Obs','Cirurgico_TEV_Avaliacao24h_Resp','Cirurgico_TEV_Avaliacao24h_Obs','Cirurgico_TEV_PrescricaoProtocolo_Resp','Cirurgico_TEV_PrescricaoProtocolo_Obs','Cirurgico_TEV_Reavaliacao_Diaria_Enfermagem_Resp','Cirurgico_TEV_Reavaliacao_Diaria_Enfermagem_Obs','Cirurgico_SAE_HistoricoEnf_Resp','Cirurgico_SAE_HistoricoEnf_Obs','Cirurgico_SAE_DiagnosticoEnf_Resp','Cirurgico_SAE_DiagnosticoEnf_Obs','Cirurgico_SAE_CuidadosPrescritos_Resp','Cirurgico_SAE_CuidadosPrescritos_Obs','Cirurgico_Riscos_AvaliacaoQueda_Resp','Cirurgico_Riscos_AvaliacaoQueda_Obs','Cirurgico_Riscos_AvaliacaoBroncoaspiracao_Resp','Cirurgico_Riscos_AvaliacaoBroncoaspiracao_Obs','Cirurgico_Riscos_AvaliacaoLesao_Resp','Cirurgico_Riscos_AvaliacaoLesao_Obs','Cirurgico_PlanoMedico_BemDefinido_Resp','Cirurgico_PlanoMedico_BemDefinido_Obs','Cirurgico_PlanoMulti_Existente_Resp','Cirurgico_PlanoMulti_Existente_Obs','Cirurgico_PlanoMulti_Metas_Resp','Cirurgico_PlanoMulti_Metas_Obs','Cirurgico_PlanoMulti_Reavaliacao_Resp','Cirurgico_PlanoMulti_Reavaliacao_Obs','Cirurgico_PlanoMulti_TodasCategorias_Resp','Cirurgico_PlanoMulti_TodasCategorias_Obs','Cirurgico_EvolucaoEnf_InfoClara_Resp','Cirurgico_EvolucaoEnf_InfoClara_Obs','Cirurgico_AnotacaoEnf_InfoClara_Resp','Cirurgico_AnotacaoEnf_InfoClara_Obs','Cirurgico_EvolucaoMedica_InfoClara_Resp','Cirurgico_EvolucaoMedica_InfoClara_Obs','Cirurgico_PlanoCuidado_InfoRelevante_Resp','Cirurgico_PlanoCuidado_InfoRelevante_Obs','Cirurgico_Eventos_Identificado_Resp','Cirurgico_Eventos_Identificado_Obs','Cirurgico_Eventos_Notificado_Resp','Cirurgico_Eventos_Notificado_Obs','Cirurgico_TCLE_Cirurgico_Resp','Cirurgico_TCLE_Cirurgico_Obs','Cirurgico_TCLE_Anestesico_Resp','Cirurgico_TCLE_Anestesico_Obs','Cirurgico_ConsultaPre_Registrada_Resp','Cirurgico_ConsultaPre_Registrada_Obs','Cirurgico_Boletim_Preenchido_Resp','Cirurgico_Boletim_Preenchido_Obs','Cirurgico_Checklist_SignIn_Resp','Cirurgico_Checklist_SignIn_Obs','Cirurgico_Checklist_Demarcacao_Resp','Cirurgico_Checklist_Demarcacao_Obs','Cirurgico_Checklist_TimeOut_Resp','Cirurgico_Checklist_TimeOut_Obs','Cirurgico_Checklist_Profilaxia60min_Resp','Cirurgico_Checklist_Profilaxia60min_Obs','Cirurgico_Checklist_SignOut_Resp','Cirurgico_Checklist_SignOut_Obs','Cirurgico_Checklist_Contagem_Resp','Cirurgico_Checklist_Contagem_Obs','Cirurgico_Alta_Sumario_Resp','Cirurgico_Alta_Sumario_Obs','Cirurgico_Alta_Orientacoes_Resp','Cirurgico_Alta_Orientacoes_Obs','Cirurgico_Final_UsoInadequadoSiglas_Resp','Cirurgico_Final_UsoInadequadoSiglas_Obs','Obstétrico_Id_NomePaciente_Resp','Obstétrico_Id_NomePaciente_Obs','Obstétrico_Id_DataNasc_Resp','Obstétrico_Id_DataNasc_Obs','Obstétrico_Id_Sexo_Resp','Obstétrico_Id_Sexo_Obs','Obstétrico_Id_NomeMae_Resp','Obstétrico_Id_NomeMae_Obs','Obstétrico_Id_NomeMae_Resp','Obstétrico_Id_Endereco_Resp','Obstétrico_Id_Endereco_Obs','Obstétrico_Triagem_Realizada_Resp','Obstétrico_Triagem_Realizada_Obs','Obstétrico_Triagem_ClassificacaoCorreta_Resp','Obstétrico_Triagem_ClassificacaoCorreta_Obs','Obstétrico_HDA_QuadroClinico_Resp','Obstétrico_HDA_QuadroClinico_Obs','Obstétrico_HDA_CondutaMedica_Resp','Obstétrico_HDA_CondutaMedica_Obs','Obstétrico_HDA_ExameFisico_Resp','Obstétrico_HDA_ExameFisico_Obs','Obstétrico_HDA_Comorbidades_Resp','Obstétrico_HDA_Comorbidades_Obs','Obstétrico_HDA_Alergias_Resp','Obstétrico_HDA_Alergias_Obs','Obstétrico_HDA_ExamesComplementares_Resp','Obstétrico_HDA_ExamesComplementares_Obs','Obstétrico_HDA_HipoteseDiagnostica_Resp','Obstétrico_HDA_HipoteseDiagnostica_Obs','Obstétrico_Reconciliacao_Medicacao_Uso_Resp','Obstétrico_Reconciliacao_Medicacao_Uso_Obs','Obstétrico_Reconciliacao_Dose_Resp','Obstétrico_Reconciliacao_Dose_Obs','Obstétrico_Reconciliacao_Frequencia_Resp','Obstétrico_Reconciliacao_Frequencia_Obs','Obstétrico_Reconciliacao_Medicacao_Mantida_Resp','Obstétrico_Reconciliacao_Medicacao_Mantida_Obs','Obstétrico_Transporte_Diagnostico_Resp','Obstétrico_Transporte_Diagnostico_Obs','Obstétrico_Transporte_SinalAlergias_Resp','Obstétrico_Transporte_SinalAlergias_Obs','Obstétrico_Transporte_Precaucoes_Resp','Obstétrico_Transporte_Precaucoes_Obs','Obstétrico_Transporte_MotivoTransferencia_Resp','Obstétrico_Transporte_MotivoTransferencia_Obs','Obstétrico_Transporte_UnidadeOrigem_Resp','Obstétrico_Transporte_UnidadeOrigem_Obs','Obstétrico_Transporte_UnidadeDestino_Resp','Obstétrico_Transporte_UnidadeDestino_Obs','Obstétrico_Transporte_IdRiscos_Resp','Obstétrico_Transporte_IdRiscos_Obs','Obstétrico_Transporte_SSVVAtualizado_Resp','Obstétrico_Transporte_SSVVAtualizado_Obs','Obstétrico_Transporte_Criterios_Resp','Obstétrico_Transporte_Criterios_Obs','Obstétrico_Transporte_RecomendacoesPreenchidas_Resp','Obstétrico_Transporte_RecomendacoesPreenchidas_Obs','Obstétrico_TEV_Avaliacao24h_Resp','Obstétrico_TEV_Avaliacao24h_Obs','Obstétrico_TEV_PrescricaoProtocolo_Resp','Obstétrico_TEV_PrescricaoProtocolo_Obs','Obstétrico_TEV_Reavaliacao_Diaria_Enfermagem_Resp','Obstétrico_TEV_Reavaliacao_Diaria_Enfermagem_Obs','Obstétrico_SAE_HistoricoEnf_Resp','Obstétrico_SAE_HistoricoEnf_Obs','Obstétrico_SAE_DiagnosticoEnf_Resp','Obstétrico_SAE_DiagnosticoEnf_Obs','Obstétrico_SAE_CuidadosPrescritos_Resp','Obstétrico_SAE_CuidadosPrescritos_Obs','Obstétrico_Riscos_AvaliacaoQueda_Resp','Obstétrico_Riscos_AvaliacaoQueda_Obs','Obstétrico_Riscos_AvaliacaoBroncoaspiracao_Resp','Obstétrico_Riscos_AvaliacaoBroncoaspiracao_Obs','Obstétrico_Riscos_AvaliacaoLesao_Resp','Obstétrico_Riscos_AvaliacaoLesao_Obs','Obstétrico_PlanoMedico_BemDefinido_Resp','Obstétrico_PlanoMedico_BemDefinido_Obs','Obstétrico_PlanoMulti_Existente_Resp','Obstétrico_PlanoMulti_Existente_Obs','Obstétrico_PlanoMulti_Metas_Resp','Obstétrico_PlanoMulti_Metas_Obs','Obstétrico_PlanoMulti_Reavaliacao_Resp','Obstétrico_PlanoMulti_Reavaliacao_Obs','Obstétrico_PlanoMulti_TodasCategorias_Resp','Obstétrico_PlanoMulti_TodasCategorias_Obs','Obstétrico_EvolucaoEnf_InfoClara_Resp','Obstétrico_EvolucaoEnf_InfoClara_Obs','Obstétrico_AnotacaoEnf_InfoClara_Resp','Obstétrico_AnotacaoEnf_InfoClara_Obs','Obstétrico_EvolucaoMedica_InfoClara_Resp','Obstétrico_EvolucaoMedica_InfoClara_Obs','Obstétrico_PlanoCuidado_InfoRelevante_Resp','Obstétrico_PlanoCuidado_InfoRelevante_Obs','Obstétrico_Eventos_Identificado_Resp','Obstétrico_Eventos_Identificado_Obs','Obstétrico_Eventos_Notificado_Resp','Obstétrico_Eventos_Notificado_Obs','Obstétrico_TCLE_Obstetrico_Resp','Obstétrico_TCLE_Obstetrico_Obs','Obstétrico_TCLE_Anestesico_Resp','Obstétrico_TCLE_Anestesico_Obs','Obstétrico_ConsultaPre_Registrada_Resp','Obstétrico_ConsultaPre_Registrada_Obs','Obstétrico_Boletim_Preenchido_Resp','Obstétrico_Boletim_Preenchido_Obs','Obstétrico_Parto_PrimeiraEtapa_Resp','Obstétrico_Parto_PrimeiraEtapa_Obs','Obstétrico_Parto_StatusParto_Resp','Obstétrico_Parto_StatusParto_Obs','Obstétrico_Parto_ClassificaoRobson_Resp','Obstétrico_Parto_ClassificaoRobson_Obs','Obstétrico_Parto_DadosClinicos_Resp','Obstétrico_Parto_DadosClinicos_Obs','Obstétrico_Parto_SegundaEtapa_Resp','Obstétrico_Parto_SegundaEtapa_Obs','Obstétrico_Parto_Tipo&Hemorragia_Resp','Obstétrico_Parto_Tipo&Hemorragia_Obs','Obstétrico_Parto_ATBCesarea_Resp','Obstétrico_Parto_ATBCesarea_Obs','Obstétrico_Funcionamento_Equipamento_Resp','Obstétrico_Funcionamento_Equipamento_Obs','Obstétrico_Parto_TerceiraEtapa_Resp','Obstétrico_Parto_TerceiraEtapa_Obs','Obstétrico_Parto_CompressasRegistradas_Resp','Obstétrico_Parto_CompressasRegistradas_Obs','Obstétrico_Parto_SangramentoDocumentado_Resp','Obstétrico_Parto_SangramentoDocumentado_Obs','Obstétrico_Parto_Apgar_Resp','Obstétrico_Parto_Apgar_Obs','Obstétrico_Parto_Profilaxias_Resp','Obstétrico_Parto_Profilaxias_Obs','Obstétrico_Profilaxia_Iodopovidona_Resp','Obstétrico_Profilaxia_Iodopovidona_Obs','Obstétrico_Parto_QuartaEtapa_Resp','Obstétrico_Parto_QuartaEtapa_Obs','Obstétrico_Parto_IdentificacaoBinomio_Resp','Obstétrico_Parto_IdentificacaoBinomio_Obs','Obstétrico_Parto_SSVVPuerpura_Resp','Obstétrico_Parto_SSVVPuerpura_Obs','Obstétrico_Parto_SSVVRn_Resp','Obstétrico_Parto_SSVVRn_Obs','Obstétrico_Parto_AleitamentoExclusivo_Resp','Obstétrico_Parto_AleitamentoExclusivo_Obs','Obstétrico_Alta_Sumario_Resp','Obstétrico_Alta_Sumario_Obs','Obstétrico_Alta_Orientacoes_Resp','Obstétrico_Alta_Orientacoes_Obs','Obstétrico_Final_UsoInadequadoSiglas_Resp','Obstétrico_Final_UsoInadequadoSiglas_Obs','Fonoaudiologia_EvolucaoAdulto_DocMV_Resp','Fonoaudiologia_EvolucaoAdulto_DocMV_Obs','Fonoaudiologia_EvolucaoAdulto_GrauDisfagia_Resp','Fonoaudiologia_EvolucaoAdulto_GrauDisfagia_Obs','Fonoaudiologia_EvolucaoAdulto_ConsistenciaDieta_Resp','Fonoaudiologia_EvolucaoAdulto_ConsistenciaDieta_Obs','Fonoaudiologia_EvolucaoAdulto_DietaSugerida_Resp','Fonoaudiologia_EvolucaoAdulto_DietaSugerida_Obs','Fonoaudiologia_EvolucaoAdulto_Conduta_Resp','Fonoaudiologia_EvolucaoAdulto_Conduta_Obs','Fonoaudiologia_EvolucaoPed_DocMV_Resp','Fonoaudiologia_EvolucaoPed_DocMV_Obs','Fonoaudiologia_EvolucaoPed_Conduta_Resp','Fonoaudiologia_EvolucaoPed_Conduta_Obs','Fonoaudiologia_Orelhinha_DocMV_Resp','Fonoaudiologia_Orelhinha_DocMV_Obs','Fonoaudiologia_Orelhinha_Resultado_Resp','Fonoaudiologia_Orelhinha_Resultado_Obs','Fonoaudiologia_Final_UsoInadequadoSiglas_Resp','Fonoaudiologia_Final_UsoInadequadoSiglas_Obs','Fisioterapia_EvolucaoAdulto_DocMV_Resp','Fisioterapia_EvolucaoAdulto_DocMV_Obs','Fisioterapia_EvolucaoAdulto_NivelAtividade_Resp','Fisioterapia_EvolucaoAdulto_NivelAtividade_Obs','Fisioterapia_EvolucaoAdulto_DeficitForca_Resp','Fisioterapia_EvolucaoAdulto_DeficitForca_Obs','Fisioterapia_EvolucaoAdulto_ProjetoTerapeutico_Resp','Fisioterapia_EvolucaoAdulto_ProjetoTerapeutico_Obs','Fisioterapia_EvolucaoAdulto_conduta_terapeutica_Resp', 'Fisioterapia_EvolucaoAdulto_conduta_terapeutica_Obs','Fisioterapia_EvolucaoAdulto_MudancaConduta_Resp','Fisioterapia_EvolucaoAdulto_MudancaConduta_Obs','Fisioterapia_EvolucaoPed_DocMV_Resp','Fisioterapia_EvolucaoPed_DocMV_Obs','Fisioterapia_EvolucaoPed_Conduta_Resp','Fisioterapia_EvolucaoPed_Conduta_Obs','Fisioterapia_EvolucaoPed_PlanoTerapeutico_Resp','Fisioterapia_EvolucaoPed_PlanoTerapeutico_Obs','Fisioterapia_Testes_Manovacuometria_Resp','Fisioterapia_Testes_Manovacuometria_Obs','Fisioterapia_Testes_Dinamometria_Resp','Fisioterapia_Testes_Dinamometria_Obs','Fisioterapia_Testes_DiarioCaminhada_Resp','Fisioterapia_Testes_DiarioCaminhada_Obs','Fisioterapia_Testes_DistanciaPercorrida_Resp','Fisioterapia_Testes_DistanciaPercorrida_Obs','Fisioterapia_Final_UsoInadequadoSiglas_Resp','Fisioterapia_Final_UsoInadequadoSiglas_Obs','Nutrição_triagem_UTI_Resp','Nutrição_triagem_UTI_Obs','Nutrição_avaliacao_completa_Resp','Nutrição_avaliacao_completa_Obs','Nutrição_pl_terapeutico_nutri_Resp','Nutrição_pl_terapeutico_nutri_Obs','Nutrição_evolucao_revisita_Resp','Nutrição_evolucao_revisita_Obs','Nutrição_orientacao_alta_Resp','Nutrição_orientacao_alta_Obs','Nutrição_UsoInadequadoSiglas_Resp','Nutrição_UsoInadequadoSiglas_Obs'];

    const linhaParaSalvar = ordemDasColunas.map(nomeColuna => dadosFormulario[nomeColuna] || "");
    linhaParaSalvar[0] = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Respostas!A1',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [linhaParaSalvar] },
    });

    res.status(200).json({ message: '✅ Avaliação salva com sucesso!' });

  } catch (error) {
    console.error('ERRO NO BACK-END:', error);
    res.status(500).json({ message: '❌ Erro ao salvar na planilha.', error: error.message });
  }
});


// Inicia o servidor
//app.listen(3000, () => {
//  console.log('Servidor rodando!');
//});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});