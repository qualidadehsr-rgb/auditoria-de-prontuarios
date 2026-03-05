import os
import io
import json
import polars as pl

from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.cloud import bigquery

#ler arquivo .env
load_dotenv()

#lendo a chave
credenciais_bruta = os.environ.get('GOOGLE_CREDENTIALS')

#trasnformando a chave em dicionario json
credenciais_dict = json.loads(credenciais_bruta)

#permissão para leitura de planilhas
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/bigquery']

#acessando servidor do google
credenciais_google = service_account.Credentials.from_service_account_info(credenciais_dict, scopes=SCOPES)

#criando serviço de conexão
servico_sheets = build('sheets', 'v4', credentials=credenciais_google)

#definindo ID da planilha
PLANILHA_ID = '106XMiyQsje4ikigPEvlDc4KZhKNs4tpVSnMxjTcET0A'

#definindo intervalo da planilha
INTERVALO = 'Respostas!A:RS'

#buscando resultados na nuvem
resultado = servico_sheets.spreadsheets().values().get(spreadsheetId=PLANILHA_ID, range=INTERVALO).execute()

#recebendo resultado (extrai as linhas da planilha)
valores = resultado.get('values', [])

#cabeçalho da planilha
cabecalho = valores[0]

#dados sem cabeçalho
dados_reais = valores[1:]

#tamanho do cabeçalho (colunas)
tamanho_cabecalho = len(cabecalho)

#lista com dados preenchidos 'None'
dados_padronizados = []

#ajustando linhas que estão vazias
for linha in dados_reais:
    espacos_faltantes = tamanho_cabecalho - len(linha)
    ajuste = linha + ([None] * espacos_faltantes)
    dados_padronizados.append(ajuste)

#mapeando as colunas e transformando em tipo texto
esquema_bronze = {coluna: pl.String for coluna in cabecalho}

#criando dataframe
df = pl.DataFrame(dados_padronizados, schema=esquema_bronze, orient='row')

#criando acesso ao BQ
cliente_bq = bigquery.Client(credentials=credenciais_google, project='comissao-prontuario')

#definindo local para salvar os dados
endereco = 'comissao-prontuario.prontuarios_dados.bronze_legado_respostas'

#configuração
config_job = bigquery.LoadJobConfig(write_disposition='WRITE_TRUNCATE')
config_job.source_format = bigquery.SourceFormat.PARQUET

#criando espaço vazio na memória e guardando data frame
arquivo_virtual = io.BytesIO()
df.write_parquet(arquivo_virtual)
arquivo_virtual.seek(0) #para bq ler do inicio

#definindo recibo de entrega dos dados
job = cliente_bq.load_table_from_file(arquivo_virtual, endereco, job_config=config_job)

#aguardar finalizar processo
job.result()

print(f'Carga de dados concluída! Linhas inseridas: {job.output_rows}')