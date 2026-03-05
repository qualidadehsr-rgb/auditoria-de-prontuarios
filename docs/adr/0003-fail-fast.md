### ADR 003: Inicialização da Aplicação com Padrão "Fail Fast"

* **Data:** Fevereiro de 2026
* **Status:** Aceito e Implementado
* **Contexto:** Serviços em nuvem podem falhar silenciosamente se variáveis de ambiente ou credenciais estiverem incorretas ou ausentes.
* **Decisão:** O servidor Node.js deve tentar carregar e parsear as credenciais do BigQuery antes de abrir a porta de escuta HTTP. Caso a credencial seja inválida, a aplicação invoca um `process.exit(1)`.
* **Consequências (Trade-offs):**
  * *Positivo:* Evita que a aplicação suba em um estado degradado, impedindo que o usuário preencha uma auditoria inteira para só no final descobrir que o banco de dados está inacessível.
  * *Negativo:* O container da aplicação não iniciará caso a injeção de secrets da plataforma de hospedagem (Render) falhe.