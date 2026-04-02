# ADR 0026: Uso do Google Secret Manager para credenciais

**Data:** 02 de abril de 2026
**Status:** Aceito

## 1. Contexto
O projeto usa service accounts do GCP para autenticar scripts Python e o dbt. Anteriormente as credenciais ficavam em arquivo `.env` local, o que criava dois problemas: dependência de arquivo local não versionado (setup diferente em cada computador) e risco de exposição acidental (já ocorreu em 26/03/2026).

## 2. Decisão
Migrar as credenciais para o Google Secret Manager. O script `atualiza_dicionario.py` busca o JSON da service account diretamente do cofre em tempo de execução, sem depender de arquivo local.

## 3. Consequências

### Positivas
- Credenciais centralizadas e auditáveis no GCP
- Setup idêntico em qualquer computador — sem `.env` necessário
- Rotação de chaves simplificada: atualiza no cofre, todos os ambientes se beneficiam automaticamente
- Custo zero para o volume atual (~90 acessos/mês vs limite gratuito de 10.000)

### Negativas
- Requer autenticação prévia com `gcloud auth application-default login` para rodar localmente
- Contas corporativas com restrições de TI podem bloquear esse fluxo (ocorreu em 01/04/2026 com conta `qualidade.hsr@gruposanta.com.br`) — solução alternativa: variável de ambiente `GOOGLE_APPLICATION_CREDENTIALS`

## 4. Alternativas consideradas
- **Arquivo `.env` local:** Descartado por criar inconsistência entre ambientes e risco de exposição.
- **Hardcoded no código:** Descartado por ser inseguro e impossível de rotacionar.