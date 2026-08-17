# Critérios de aceitação — Camada de abstração LMTY

## Propósito

A camada de abstração reúne policy, contexto, memória externa, capability boundary, verificadores e traces em um fluxo observável. Os grafos do LMTY não medem a inteligência intrínseca do modelo. Eles medem propriedades verificáveis do **harness** e do artifact `.lmty`.

| Dimensão | Definição | Peso |
|---|---|---:|
| Context balance | As alocações `system`, `attachment`, `evidence` e `task` conservam 100% do orçamento. | 22% |
| Capability isolation | O fluxo expõe ao menos uma ferramenta explicitamente permitida e não cria autoelevação. | 20% |
| Trace continuity | A rota leva os verificadores ao trace ledger. | 22% |
| Verifier integrity | Os verificadores configurados recebem uma passagem no grafo. | 20% |
| Memory efficiency | A política externa estima compressão `16 / bits`, limitada ao intervalo [0, 1]. | 16% |

O score é a média ponderada das cinco dimensões. Um cenário é aceito quando o score é pelo menos `0,90` e todos os invariantes duros são verdadeiros: orçamento conservado, capability boundary configurado, cobertura de traces >= `0,90` e cobertura de verificadores >= `0,90`.

## Cenários iterativos

| Cenário | Context budget | Bits | Tools | Cobertura de trace/verifier |
|---|---:|---:|---|---:|
| Constrained | 384 | 4 | 2 | 0,95 / 0,92 |
| Balanced | 640 | 4 | 3 | 0,98 / 0,96 |
| Long-context | 1.024 | 8 | 4 | 0,99 / 0,98 |

Esses cenários são **fixtures determinísticas de arquitetura**; não devem ser interpretados como benchmark de qualidade de um modelo de linguagem externo.

