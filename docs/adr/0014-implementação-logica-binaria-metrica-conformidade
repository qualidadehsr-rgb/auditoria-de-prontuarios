# ADR 0014: Implementação de Lógica Binária para Métricas de Conformidade

## Status
Aceito

## Data
2026-03-17

## Contexto
Anteriormente, o Looker Studio era responsável por interpretar as strings de texto ("Conforme", "Não Conforme", "N/A") para calcular as taxas de conformidade em tempo real. 

Essa abordagem gerava três problemas principais:
1. **Performance:** O dashboard ficava lento ao processar fórmulas complexas de texto para milhares de linhas.
2. **FinOps:** Consultas baseadas em strings e cálculos em tempo de execução no BI aumentam o tempo de latência e o esforço de processamento.
3. **Manutenção:** A regra de negócio estava "escondida" dentro do Looker Studio, dificultando a replicação em outros relatórios ou ferramentas.

## Decisão
Decidimos mover a lógica de cálculo para a camada de transformação de dados (**Camada Gold**) no BigQuery, utilizando colunas binárias ($0$ e $1$).

Foram criadas duas novas métricas na View `gold_auditorias_consolidadas`:
- **`qtde_conforme`**: Atribui $1$ apenas para o status "Conforme".
- **`qtde_valida`**: Atribui $1$ para "Conforme" e "Não Conforme", e $0$ para "N/A" (indicando que a pergunta deve ser considerada no denominador da taxa).

A fórmula da Taxa de Conformidade no BI passa a ser uma soma simples:  
$$\text{Taxa \%} = \frac{\sum(\text{qtde\_conforme})}{\sum(\text{qtde\_valida})}$$

## Consequências

### Positivas
- **Velocidade:** O Looker Studio carrega os dados instantaneamente, pois realiza apenas operações de `SUM`.
- **Padronização:** A regra de o que é "Conforme" ou "Válido" está centralizada no SQL (Source of Truth).
- **FinOps:** Redução da carga cognitiva e de processamento da camada de visualização.

### Negativas
- Ligeiro aumento na complexidade do script SQL da View Gold para comportar os blocos `CASE WHEN`.