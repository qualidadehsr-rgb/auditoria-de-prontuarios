# ADR 0027: Eliminação do CSV intermediário no fluxo do dicionário

**Data:** 02 de abril de 2026
**Status:** Aceito

## 1. Contexto
O fluxo original do dicionário de perguntas tinha duas etapas manuais separadas:
1. Rodar `extrai_dicionario_real.py` — gerava `dicionario_oficial.csv`
2. Carregar o CSV manualmente no BigQuery via console

Esse processo dependia de memória humana — se alguém atualizasse o formulário e esquecesse de rodar o script e carregar o CSV, o dicionário ficaria desatualizado. Isso ocorreu em 31/03/2026, quando 75 perguntas Obstétricas chegaram na Gold sem `pergunta_formatada`.

## 2. Decisão
Substituir o fluxo de duas etapas por um único script `atualiza_dicionario.py` que lê a `estrutura_bruta` do formulário e carrega diretamente na tabela `prontuarios_dados.dim_perguntas` no BigQuery, sem CSV intermediário.

## 3. Consequências

### Positivas
- Processo atômico — ou tudo funciona ou nada muda
- Elimina arquivo CSV solto na raiz do projeto
- Elimina risco de usar CSV desatualizado por engano
- Preparado para automação no CI (Issue #31 — Fase 5)

### Negativas
- Requer credencial válida para rodar — não funciona offline
- Perde a possibilidade de inspecionar o dicionário em Excel antes de carregar (uso raro, não justifica manter)

## 4. Alternativas consideradas
- **Manter o CSV:** Descartado por criar etapa manual propensa a erro humano.
- **Carregar CSV via GitHub Actions:** Considerado mas descartado — adiciona complexidade sem benefício real já que o script Python resolve o problema de forma mais direta.

## 5. Impacto técnico
- `extrai_dicionario_real.py` mantido no repositório como referência histórica mas sem uso ativo
- `dicionario_oficial.csv` removido do fluxo ativo
- Tabela `dim_perguntas` agora é alimentada exclusivamente pelo `atualiza_dicionario.py`