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
const BQ_CONFIG_TABLE_ID = 'configuracoes';
const BQ_BRONZE_WEB_TABLE_ID = 'bronze_respostas_web';

//Configurando o servidor web (express)
app.use(express.json()); //servidor lê os dados que o HTML enviar
const helmet = require('helmet'); // adicionar headers de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://stackpath.bootstrapcdn.com"],
      connectSrc: ["'self'","https://stackpath.bootstrapcdn.com"],
    }
  }
}))
//limitação de requisições por IP
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
                windowMs: 15 * 60 * 1000,
                max: 100,
                message: {message: 'Muitas requisições. Tente novamente em 15 minutos.'}
});
app.use(limiter);
app.use(express.static('public')); //informa o servidor que os arquivos HTML e CSS ficaram em uma pasta 'public'

// --- OBSERVABILIDADE (LOGS ESTRUTURADOS) ---
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
//lista de requisitos para verificação antes de salvar no BQ

// função para validação em perguntas "Não conforme"
function validarObservacoesObrigatorias(dadosFormulario){
  const perguntasSemObservacao = []; // array para guardar o prefixo das perguntas com problemas

  // percorre todos os campos do formulário
  for (const chave in dadosFormulario){
    // duas condições verificadas: filtra só chaves que são respostas e dentre as respostas filtra as que são não conforme
    if (chave.endsWith('_Resp') && dadosFormulario[chave] === 'Não conforme'){
      // retira o prefixo e deixa apenas o nome da pergunta
      const prefixo = chave.slice(0, -('_Resp'.length));
      // monta o nome da chave de observação
      const chaveObs = `${prefixo}_Obs`;
      // busca o valor do campo de observação 
      const observacao = dadosFormulario[chaveObs];

      // verifica se o campo de observação esta vazio
      if (!observacao || observacao.trim() === ''){
        // adiciona o nome da pergunta na lista de problemas
        perguntasSemObservacao.push(prefixo);
      }
    }
  }

  return perguntasSemObservacao;
}

app.post('/api/salvar-dados', async(req, res) => {
  try {
    const dadosFormulario = req.body; //usa o arquivo json do front-end
    const listaRequisitos = ['nomeEmpresa', 'nomeAvaliador', 'dataAvaliacao',
                        'setorAvaliado', 'numAtendimento', 'tipoProntuario',
                        'especialidade', 'tipoAvaliacao'];
    for (const campo of listaRequisitos){
      if (!dadosFormulario[campo] || dadosFormulario[campo] == ''){
        return res.status(400).json({
          message: `Erro de validação: O campo ${campo} é obrigatório e não foi enviado!`});
        }
      }
    // chama função de validação e guarda resultado
    const perguntasSemObservacao = validarObservacoesObrigatorias(dadosFormulario);
    // verifica se a lista esta vazia
    if (perguntasSemObservacao.length > 0) {
      // retorna erro de quem enviou o dado, a quantidade de perguntas com problemas e a lista dessas perguntas
      return res.status(400).json({
        message: `Erro de validação: existem ${perguntasSemObservacao.length} pergunta(s) marcada(s) como "Não conforme" sem observação preenchida.`,
        perguntas: perguntasSemObservacao
      });
    }

    const idResposta = uuidv4(); //gera ID único para cada resposta
    const dataSubmissao = new Date().toISOString();

    //ID e o dicionário bruto
    const linhaBronze = {
    id_submissao: idResposta,
    conteudo_bruto: JSON.stringify(dadosFormulario)
  };
    // Salva na bronze_respostas_web (data_hora inserido pelo BigQuery)
    await bigqueryClient.dataset(BQ_DATASET_ID).table(BQ_BRONZE_WEB_TABLE_ID).insert([linhaBronze]);

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
  app.use((err, req, res, next) => {
    console.error(JSON.stringify({
      severity:'ERROR',
      request_id: req.request_id,
      message:'Erro não tratado',
      error_detail:err.message
    }));
    res.status(500).json({message: 'Erro interno no servidor'});
  });
  app.listen(PORT, () => {console.log(`Servidor rodando na porta ${PORT}`);});