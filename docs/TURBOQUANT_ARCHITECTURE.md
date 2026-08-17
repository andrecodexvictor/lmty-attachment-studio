# TurboQuant, memória e janelas de contexto no LMTY

## Decisão de arquitetura

TurboQuant é uma técnica de quantização vetorial online para reduzir distorção de vetores e de produtos internos. A formulação combina rotação aleatória, quantização escalar e uma correção residual de 1 bit inspirada em Quantized Johnson-Lindenstrauss. O paper discute aplicação em KV cache e busca por vizinhos mais próximos [1].

Para o LMTY, a implementação inicial será **TurboQuant-inspired external memory**: quantização e compressão de vetores de relevância, evidências e memória de trabalho mantidos pelo attachment runtime. Essa camada reduz custo de armazenamento e melhora seleção de contexto sem alegar acesso aos hidden states ou ao KV cache interno de um modelo fechado.

| Superfície | Implementação LMTY | Limite |
|---|---|---|
| Memória externa / retrieval | Matriz de relevância, seleção top-k, quantização simulada e compressão | Implementável no runtime B0/B1 |
| Janela de contexto por layer | Orçamento por `system`, `attachment`, `evidence` e `task` | Implementável no harness |
| KV cache interno | Manifesto declara backend TurboQuant opcional | Exige ABI oficial do provedor |
| Hidden states / attention | Não manipulado no POC | Fora do escopo de APIs textuais fechadas |

## Modelo matemático implementado

Para cada item de memória `m_i`, o runtime calcula uma prioridade:

```text
score_i = 0.45 × relevance_i + 0.25 × recency_i + 0.20 × reliability_i + 0.10 × utility_i
```

Os itens são ordenados por `score_i` e selecionados até o limite de tokens da layer `evidence`. A matriz de relevância `R` mantém `R_ij = cosine(m_i, q_j)` para consultas ou classes de tarefa. A redução de memória é estimada por:

```text
compression_ratio = full_precision_bits / quantized_bits
```

No POC, `quantized_bits` é um parâmetro de política e não representa uma quantização do KV cache de um provedor.

## Fontes

[1] [TurboQuant: Online Vector Quantization with Near-optimal Distortion Rate](https://arxiv.org/abs/2504.19874).

[2] [Google Research: TurboQuant — Redefining AI efficiency with extreme compression](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/).
