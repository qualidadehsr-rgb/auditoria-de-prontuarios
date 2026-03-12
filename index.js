//carregar variáveis de ambiente
require('dotenv').config();

//chamar o servidor
const express = require('express');

//conectando com o banco
const { BigQuery } = require('@google-cloud/bigquery');

//chamando gerador de IDs únicos (versão 4)
const { v4: uuidv4 } = require('uuid');

//ligando a biblioteca express
const app = express();

//criando variável vazia para guardar a credencial
let credentials;

try{
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
}
catch(error){
  console.error("ERRO CRÍTICO: Chave inválida no .env!");
  process.exit(1);
}

//criando o cliente BG
const bigqueryClient = new BigQuery({projectId: 'comissao-prontuario', credentials: credentials});

//crianda variáveis globais para o dataset, tabela de resposta, tabela de detalhes e tabela de configurações
const BQ_DATASET_ID = 'prontuarios_dados';
const BQ_RESPOSTAS_TABLE_ID = 'silver_respostas';
const BQ_DETALHES_TABLE_ID = 'silver_detalhes_respostas';
const BQ_CONFIG_TABLE_ID = 'configuracoes';

//Configurando o servidor web (express)
app.use(express.json()); //servidor lê os dados que o HTML enviar
app.use(express.static('public')); //informa o servidor que os arquivos HTML e CSS ficaram em uma pasta 'public'

// --- MIDDLEWARE DE OBSERVABILIDADE (LOGS ESTRUTURADOS) ---
app.use((req, res, next) => {
  req.request_id = uuidv4(); // Injeta o ID único da requisição
  console.log(JSON.stringify({
    severity: 'INFO',
    request_id: req.request_id,
    method: req.method,
    url: req.url,
    message: 'Requisição recebida'
  }));
  next();
});

//API #1 BUSCA DINÂMICA (Setores e Especialidades)

//'async' deixa claro que a tarefa que ira ser realizada demora
app.get('/api/get-options', async(req, res) => {
  try{
    //usa o nome da empresa que veio da url
    const empresaSelecionada = req.query.empresa;

    //se vier vazio bloqueia
    if (!empresaSelecionada) {
      return res.status(400).json({message: 'Nome da empresa é obrigatório.'});
    }

    //consulta SQL no BigQuery
    const query = `SELECT Tipo, Valor
                  FROM \`${BQ_DATASET_ID}.${BQ_CONFIG_TABLE_ID}\`
                  WHERE Empresa = @empresa;`
    
    //objeto vazio
    const queryOptions = {query: query, params:{empresa: empresaSelecionada} };

    //executando a constulta no bigquery
    const [rows] = await bigqueryClient.query(queryOptions);

    //objeto vazio
    const options = {setores: [], especialidades: []};

    //iterando sobre a lista do banco
    rows.forEach(row => {
      if (row.Tipo === 'Setor') {
        options.setores.push(row.Valor);
      } else if (row.Tipo === 'Especialidade') {
        options.especialidades.push(row.Valor);
      }
    })
    
    //tudo certo!
    res.status(200).json(options);

  } catch (error) {
    console.error(JSON.stringify({
      severity: 'ERROR',
      request_id: req.request_id,
      endpoint: '/api/get-options',
      message: 'Erro interno ao buscar opções',
      error_detail: error.message
    }));
    res.status(500).json({message: 'Erro interno ao buscar opções.'});
  }
});

//API #2 ROTA PARA SALVAR
app.post('/api/salvar-dados', async(req, res) => {
  try {
    const dadosFormulario = req.body; //usa o arquivo json do front-end
    const idResposta = uuidv4(); //gera ID único para cada resposta
    const dataSubmissao = new Date().toISOString(); //converte a data/hora para string

    //mapeando cabeçado do formulário
    const camposComuns = ['nomeEmpresa', 'nomeAvaliador', 'dataAvaliacao', 'setorAvaliado', 'numAtendimento', 'tipoProntuario', 'especialidade', 'tipoAvaliacao'];
    
    //objeto para salvar as respostas no banco
    const linhaRespostas = {id_resposta: idResposta,
                            data_submissao: dataSubmissao,
                            nome_empresa: dadosFormulario.nomeEmpresa,
                            nome_avaliador: dadosFormulario.nomeAvaliador,
                            data_avaliacao: dadosFormulario.dataAvaliacao ? new Date(dadosFormulario.dataAvaliacao + 'T00:00:00').toISOString().slice(0, 19).replace('T', ' ') : null,
                            setor_avaliado: dadosFormulario.setorAvaliado,
                            numero_atendimento: String(dadosFormulario.numAtendimento || ""),
                            tipo_prontuario: dadosFormulario.tipoProntuario,
                            especialidade: dadosFormulario.especialidade,
                            tipo_avaliacao: dadosFormulario.tipoAvaliacao
    };

    //lista vazia com os detalhes das perguntas
    const linhasDetalhes = [];

    //criando um dicionário com respostas e detalhes
    for (const [key, value] of Object.entries(dadosFormulario)) {
      if (!camposComuns.includes(key) && value !== "") {
        linhasDetalhes.push({id_detalhe: uuidv4(), id_resposta: idResposta, nome_pergunta: key, valor_resposta: String(value)});
      }
    }
    //enviando para o bigquery
    await
    bigqueryClient.dataset(BQ_DATASET_ID).table(BQ_RESPOSTAS_TABLE_ID).insert([linhaRespostas]);
    
    await
    bigqueryClient.dataset(BQ_DATASET_ID).table(BQ_DETALHES_TABLE_ID).insert(linhasDetalhes);

    //mensagem de sucesso
    res.status(200).json({message: 'Avaliação salva com sucesso no BigQuery!'});

  } catch (error) {
    console.error(JSON.stringify({
      severity: 'ERROR',
      request_id: req.request_id,
      endpoint: '/api/salvar-dados',
      message: 'Erro ao salvar avaliação',
      error_detail: error.message
    }));
    res.status(500).json({message: 'Erro ao salvar avaliação.'});
  }
});


//ligando o servidor na porta do servidor ou a 3000 localmente
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {console.log(`Servidor rodando na porta ${PORT}`);});