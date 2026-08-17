# Relatório de execução — Camada de abstração LMTY

## Resultado

O motor de abstração avaliou **45 configurações determinísticas** que combinam cinco orçamentos de contexto, três bit-widths e três conjuntos de tools. O critério de aceitação exige score estrutural de pelo menos `0,90`, conservação de orçamento, capability boundary configurado e continuidade entre verificadores e traces.

| Indicador | Resultado |
|---|---:|
| Configurações exploradas | 45 |
| Configurações aceitas | 30 |
| Melhor configuração | 384 tokens, 4-bit, `filesystem,test_runner` |
| Score estrutural selecionado | 0,988 |
| Objetivo composto selecionado | 0,993 |
| Invariantes satisfeitos | 4 de 4 |

O grafo usa oito nós e oito relações: `system → attachment → memory → evidence → task → tools → verifiers → trace → memory`. O loop final atualiza memória externa a partir da evidência observável produzida por cada trace.

## Limites de interpretação

O score mede apenas propriedades do harness LMTY; ele **não mede inteligência, factualidade ou qualidade geral de um LLM externo**. A compactação `16 / bits` é uma estimativa de política sobre memória externa. A aplicação de TurboQuant ao KV cache interno depende de uma ABI do provedor que exponha esse caminho de inferência.

## Reprodução

```bash
pnpm lmty:abstraction -- diagnose --budget 640 --bits 4
pnpm lmty:abstraction -- graph --format mermaid
pnpm lmty:scenarios
pnpm lmty:optimize-abstraction
```

Os resultados brutos estão em `reports/abstraction_scenarios.json` e `reports/abstraction_optimization.json`.
