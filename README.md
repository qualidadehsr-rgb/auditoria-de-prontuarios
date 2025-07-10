#  Sistema de Auditoria de Prontuários

Aplicação web para a realização e gerenciamento de auditorias de prontuários hospitalares, com suporte para múltiplas empresas e painéis de visualização de dados.

![Screenshot do Dashboard]([https://i.imgur.com/G4fBq3G.png](https://lookerstudio.google.com/u/2/reporting/dad1bfa4-40d9-43e0-a4b1-78d259fbd842/page/EdiQF))


---

## ✨ Funcionalidades

* **Formulário Customizado:** Interface em duas etapas com design limpo para facilitar o preenchimento.
* **Suporte Multi-Empresa:** Permite que usuários de diferentes empresas do grupo utilizem o mesmo formulário.
* **Listas Dinâmicas:** Os campos de "Setor" e "Especialidade" são carregados dinamicamente com base na empresa selecionada.
* **Armazenamento Seguro:** Os dados são salvos de forma segura em uma Planilha Google, que funciona como banco de dados central.
* **Acesso Concorrente:** Múltiplos usuários podem preencher e salvar avaliações simultaneamente sem conflito de dados.
* **Dashboards de Gestão:** Painéis interativos criados no Looker Studio para visualização e análise dos dados, com filtros por empresa, ano e mês.
* **Disponibilidade Contínua:** A aplicação é hospedada no Render.com, garantindo que o formulário esteja sempre acessível para os usuários.

---
## 💻 Tecnologias Utilizadas

* **Front-End:** HTML5, CSS3, Bootstrap 4, JavaScript (Fetch API, DOM)
* **Back-End:** Node.js, Express.js
* **Banco de Dados:** Google Sheets API v4
* **Hospedagem & Deploy:** Render.com (conectado ao GitHub)
* **Dashboards:** Google Looker Studio
* **Autenticação da API:** Google Cloud Service Account (OAuth 2.0)

---

## 📂 Estrutura do Projeto

A estrutura principal do código está organizada da seguinte forma:
/
├── public/                 # Contém os arquivos do front-end (o que o usuário vê)
│   ├── index.html          # Página 1 do formulário (coleta de dados iniciais)
│   └── Pagina2_Template.html # Página 2 do formulário (questionários dinâmicos)
├── index.js                # O servidor back-end (escrito em Express)
├── package.json            # Define as dependências e scripts do projeto Node.js
└── ...

## 🚀 Configuração e Instalação

Para replicar este projeto, os seguintes passos são necessários:

1.  **Google Sheets:** Criar uma planilha para ser o banco de dados ("Master_Respostas") e uma aba para as listas dinâmicas ("Configuracao").
2.  **Google Cloud Platform:**
    * Criar um novo projeto.
    * Ativar a API do Google Sheets.
    * Criar uma Conta de Serviço com papel de "Editor" e baixar a chave de credenciais em formato JSON.
3.  **Compartilhamento:** Compartilhar a Planilha Google com o e-mail da Conta de Serviço criada.
4.  **Variáveis de Ambiente:** Configurar uma variável de ambiente chamada `GOOGLE_CREDENTIALS` na plataforma de hospedagem (Render, Replit, etc.) e colar o conteúdo completo do arquivo JSON como seu valor.
5.  **Instalação de Dependências:** Rodar o comando `npm install` para instalar as bibliotecas (Express, googleapis, etc.).
6.  **Execução:** Rodar o comando `node index.js` para iniciar o servidor.

---

Feito com ❤️ por **Ediney Junior**.
