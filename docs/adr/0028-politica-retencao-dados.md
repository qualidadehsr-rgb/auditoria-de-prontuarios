# ADR 0028: Política de Retenção de Dados

**Data:** 02 de abril de 2026
**Status:** Aceito

## 1. Contexto
O projeto armazena análises de auditoria de prontuários hospitalares no BigQuery.
Não existe uma definição formal de por quanto tempo esses dados devem ser mantidos.
A LGPD exige prazo definido de retenção para dados de saúde. Embora as análises de
auditoria não sejam prontuários físicos, elas referenciam prontuários e podem ser
solicitadas em auditorias externas a qualquer momento.

## 2. Decisão

| Camada | Dataset | Retenção | Motivo |
|---|---|---|---|
| Bronze | `prontuarios_dados` | 10 anos | Dado bruto original — cobre qualquer solicitação de auditoria externa |
| Silver | `dbt_qualidadehsr` | 10 anos | Dado processado rastreável à origem — mesmo prazo da Bronze por segurança |
| Gold | `dbt_qualidadehsr` | Indefinida | Derivada — pode ser recriada a qualquer momento via `dbt build` |

## 3. Justificativa do prazo
- Análise gerencial padrão do setor: 5 anos de histórico
- Cobertura para auditoria externa: qualquer período pode ser solicitado
- Referência à legislação de prontuários (CFM): 10 anos de guarda obrigatória
- Embora as análises de auditoria não sejam prontuários, referenciam prontuários
  e por cautela adota-se o mesmo prazo

## 4. Impacto financeiro
- Volume atual: ~51 MB total
- Volume projetado em 10 anos: ~185 MB
- Custo de armazenamento BigQuery: $0.020/GB/mês após 10 GB gratuitos
- Custo estimado: R$ 0,02/mês — dentro do limite gratuito permanente
- Revisão recomendada se o volume de auditorias crescer 10x

## 5. Implementação
- Não há configuração de `table_expiration` no BigQuery — dados mantidos indefinidamente
- Revisão manual anual recomendada para confirmar que a política ainda faz sentido
- Responsável pela revisão: administrador do projeto (`qualidade.hsr@gruposanta.com.br`)

## 6. Alternativas consideradas
- **5 anos:** Cobre análise gerencial mas pode não cobrir auditoria externa.
- **Indefinido para todas as camadas:** Risco de acúmulo desnecessário e possível
  conflito com LGPD que exige prazo definido.