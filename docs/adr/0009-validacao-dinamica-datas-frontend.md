# ADR 0009: Validação Dinâmica de Datas no Front-end

**Data:** 12 de março de 2026  
**Status:** Aceito  
**Contexto do Projeto:** Auditoria de Prontuários (Frente 3 - Governança e Qualidade de Dados)

## 1. Contexto e Problema
Auditores frequentemente cometiam erros de digitação no campo "Data da Avaliação", inserindo datas futuras ou períodos muito antigos. Isso gerava inconsistências nos dashboards do Looker Studio e exigia limpezas manuais constantes na base de dados.

## 2. Decisão Arquitetural
Implementamos uma trava lógica diretamente no `index.html` (via JavaScript nativo) para restringir o componente de calendário (`input type="date"`). 
* A data **mínima** foi definida como o primeiro dia do mês anterior.
* A data **máxima** foi definida como a data atual (hoje).

## 3. Consequências

### Positivas:
* **Qualidade de Dados na Origem:** Impede a entrada de "lixo" antes mesmo do dado chegar à API.
* **Experiência do Usuário (UX):** O calendário bloqueia visualmente as datas inválidas, orientando o auditor de forma imediata.
* **Custo Zero:** Implementação simples em Vanilla JS, sem dependências de bibliotecas externas.

### Negativas/Atenção:
* **Casos de Exceção:** Auditorias retroativas de meses muito distantes agora exigem autorização da TI para liberação manual ou alteração temporária do código.