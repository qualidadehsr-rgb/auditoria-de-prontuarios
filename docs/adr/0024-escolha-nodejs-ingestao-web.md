# ADR 0024: Escolha do Node.js + Express para Ingestão Web

**Data:** Março de 2026
**Status:** Aceito

## 1. Contexto
O projeto precisava de uma API leve para receber as submissões do formulário web de auditoria e gravar diretamente no BigQuery como JSON bruto (Ingestão Pura).

## 2. Decisão
Adotamos Node.js com Express.js como backend da API de ingestão near-real-time.

## 3. Justificativa
- Leve e eficiente para uma API REST simples com poucas rotas (GET e POST)
- Suporta JSON nativamente, ideal para receber e encaminhar o payload do formulário sem conversão
- Ecossistema maduro com biblioteca oficial do BigQuery (@google-cloud/bigquery)
- Mesmo runtime do front-end (JavaScript), simplificando a manutenção do monorepo

## 4. Alternativas Consideradas
- **Python (Flask/FastAPI):** Viável, mas adicionaria uma segunda linguagem na camada de ingestão sem ganho claro para uma API simples
- **Cloud Functions:** Eliminaria o servidor, mas adicionaria complexidade de deploy e cold start

## 5. Consequências
- **Positivas:** Setup rápido, deploy simples, payload JSON flui sem transformação até a Bronze
- **Negativas:** Node.js não é a escolha padrão em equipes de dados, podendo gerar estranhamento em times puramente Python