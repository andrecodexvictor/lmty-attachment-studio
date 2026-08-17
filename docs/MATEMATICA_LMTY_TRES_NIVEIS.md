# Matemática do LMTY em três níveis

## Resumo executivo

O LMTY não tenta alterar diretamente os parâmetros internos de um LLM. Ele constrói uma **camada de decisão externa** que determina quais instruções, evidências, tools e verificadores entram na execução. A matemática serve para responder três perguntas: **o que cabe no contexto**, **o que é mais relevante** e **se o sistema de controle está estruturalmente íntegro**.

> As fórmulas desta nota descrevem a implementação atual do LMTY Studio. Elas são métricas de arquitetura e não constituem uma medida universal de qualidade de modelos de linguagem.

| Nível | Pergunta respondida | Objetos principais |
|---|---|---|
| Alto | Qual a ideia que o sistema otimiza? | informação útil, fronteiras e evidência. |
| Médio | Quais fórmulas transformam a ideia em decisão? | orçamento, score, matriz, Pareto e invariantes. |
| Baixo | Como isso roda de forma determinística? | números, ordenação, arrays, limites e custo assintótico. |

---

# 1. Nível alto — um sistema que protege atenção

Um modelo possui uma quantidade limitada de contexto. O LMTY trata esse contexto como um recurso escasso e organiza sua distribuição em quatro layers: `system`, `attachment`, `evidence` e `task`. A política local do attachment define o comportamento; a memória externa contém evidências que podem ser recuperadas; a task é a necessidade imediata do usuário.

Em termos intuitivos, o Studio é um **porteiro de atenção**. Ele não precisa armazenar tudo: preserva o que tem maior valor para a próxima decisão. A MAL adiciona um segundo princípio: *capability boundary*. Mesmo que uma tool exista no ambiente, a sessão só pode usá-la se o attachment a tiver autorizado explicitamente.

O grafo de abstração fecha o ciclo:

```text
system → attachment → memory → evidence → task → tools → verifiers → trace → memory
```

O retorno `trace → memory` é essencial: a execução deixa evidência para a sessão seguinte. Isso torna o comportamento observável, em vez de depender de memória implícita e não auditável.

---

# 2. Nível médio — as fórmulas que guiam o runtime

## 2.1 Orçamento de contexto por layer

Para um orçamento total de tokens `B`, o LMTY usa pesos estáveis:

$$
B_{system}=0,18B,\quad B_{attachment}=0,22B,\quad B_{evidence}=0,42B,\quad B_{task}=0,18B
$$

Logo, a conservação é verificável:

$$
0,18 + 0,22 + 0,42 + 0,18 = 1
$$

No budget de `640` tokens, o runtime reserva aproximadamente `115`, `141`, `269` e `115` tokens, respectivamente. O arredondamento é inteiro e pode introduzir uma diferença de um token por layer; a política usa valores aproximados para orçamento, não uma garantia de tokenização do provedor.

## 2.2 Score de relevância da memória

Cada item `i` de memória carrega relevância `rᵢ`, recência `cᵢ`, confiabilidade `fᵢ` e utilidade `uᵢ`. A prioridade é uma combinação linear ponderada:

$$
s_i = 0,45r_i + 0,25c_i + 0,20f_i + 0,10u_i
$$

O peso maior de `rᵢ` favorece relação com a tarefa; recência evita que fatos operacionais envelhecidos dominem a seleção; confiabilidade protege políticas estáveis; utilidade incorpora valor prático. A escolha do contexto resolve uma forma gulosa de *knapsack*:

$$
\max_{S} \sum_{i \in S} s_i \quad \text{sujeito a} \quad \sum_{i \in S} t_i \le B_{evidence}
$$

onde `tᵢ` é o custo em tokens do item. A implementação ordena por `sᵢ` e seleciona itens enquanto houver orçamento. É determinística e simples, mas não é o ótimo global de knapsack em todos os casos.

## 2.3 Matriz de relevância

A matriz `R` descreve alinhamento entre um item de memória e uma classe de tarefa. No Studio, as colunas são `visual_ui`, `debugging` e `performance`. Para o item `i`, a implementação materializa:

$$
R_{i,visual}=0,98r_i,\quad R_{i,debug}=0,92r_i,\quad R_{i,performance}=0,78r_i
$$

Essa matriz é uma visualização de política, não um embedding aprendido. Ela torna transparente que a mesma evidência pode ter valor diferente conforme o tipo de tarefa.

## 2.4 Compactação inspirada em TurboQuant

Quando vetores externos originalmente representados em 16 bits são associados a uma largura `b`, o Studio apresenta uma razão estimada:

$$
\rho = \frac{16}{b}
$$

Com `b=4`, `ρ=4`; com `b=8`, `ρ=2`. A eficiência normalizada usada no diagnóstico é:

$$
E_{mem} = \min\left(1,\frac{16/b}{4}\right)
$$

Isso representa uma política de compactação para memória externa. O TurboQuant acadêmico é um método de quantização online; o Studio não implementa nem afirma acesso ao KV cache interno de modelos fechados.[1] [2]

## 2.5 Score estrutural da camada de abstração

O diagnóstico combina cinco dimensões no intervalo `[0,1]`:

$$
A = 0,22C + 0,20I + 0,22T + 0,20V + 0,16E_{mem}
$$

| Símbolo | Definição |
|---|---|
| `C` | Context balance: as frações de layer conservam o orçamento. |
| `I` | Capability isolation: existe boundary explícito com pelo menos uma tool. |
| `T` | Trace continuity: verificadores estão conectados ao trace ledger. |
| `V` | Verifier integrity: verificadores configurados participam do fluxo. |
| `Eₘₑₘ` | Eficiência normalizada da compactação externa. |

Um cenário é aceito quando `A ≥ 0,90` e quatro invariantes são verdadeiros: orçamento conservado, boundary configurado, cobertura de trace ≥ `0,90` e cobertura de verificadores ≥ `0,90`.

## 2.6 Fronteira de Pareto

Os candidates possuem vetores `x = (qualidade, confiabilidade, tokens, complexidade)`. Um candidate `a` domina `b` se é ao menos tão bom em todos os objetivos e estritamente melhor em pelo menos um. Qualidade e confiabilidade são maximizadas; tokens e complexidade são minimizados.

$$
a \succ b \Leftrightarrow (q_a\geq q_b) \land (r_a\geq r_b) \land (t_a\leq t_b) \land (c_a\leq c_b) \land \exists j: a_j \ne b_j
$$

A fronteira Pareto mostra soluções que não podem melhorar um objetivo sem sacrificar outro.

---

# 3. Nível baixo — o que acontece no código

## 3.1 Tipos e limites

O frontend e o backend TypeScript usam `number`, que representa ponto flutuante IEEE 754 de dupla precisão. Os budgets são inteiros e os inputs tRPC aceitam `256 ≤ B ≤ 8192`; a largura de quantização aceita `2 ≤ b ≤ 16`. Os scores são arredondados para três casas ao serem apresentados, mas a ordenação usa o valor de ponto flutuante calculado.

## 3.2 Seleção de contexto

O runtime transforma `n` itens em pares `{ item, score }`, ordena do maior para o menor e percorre a lista. A complexidade é dominada por ordenação:

| Operação | Complexidade | Memória adicional |
|---|---:|---:|
| Calcular `sᵢ` | `O(n)` | `O(n)` |
| Ordenar prioridades | `O(n log n)` | depende da implementação de sort |
| Filtrar itens dentro de `Bₑᵥᵢdₑₙcₑ` | `O(n)` | `O(k)` para selecionados |
| Materializar `R` com 3 colunas | `O(3n) = O(n)` | `O(3n)` |

O algoritmo é propositalmente previsível: não há chamada de LLM no caminho de seleção, e cada execução produz o mesmo resultado quando recebe os mesmos itens e orçamento.

## 3.3 Grafo e invariantes

O grafo possui oito nós e oito edges. Cada edge é um registro `{from, to, label, capacity}`. A análise não executa busca complexa: calcula métricas agregadas e confere invariantes booleanos. O feedback `trace → memory` é representado explicitamente e testado; sem ele, a arquitetura deixa de modelar aprendizado operacional entre chamadas.

## 3.4 CLI e reprodutibilidade

Os CLIs MJS aceitam argumentos, removem o separador `--` do `pnpm`, constroem JSON e podem emitir Mermaid. `run-abstraction-scenarios.mjs` executa três fixtures documentadas; `optimize-abstraction.mjs` explora 45 combinações determinísticas e ranqueia configurações pela função:

$$
J = 0,55A + 0,30\min(1,\rho/4) + 0,15\left(1-\frac{B-384}{1024-384}\right)
$$

O último termo favorece budgets compactos dentro da faixa experimental. `J` é um critério de engenharia para esse laboratório, não uma métrica acadêmica de desempenho de modelos.

---

# 4. Limitações e próximos refinamentos

O LMTY atual é uma camada de orquestração e avaliação externa. Para incorporar quantização real de KV cache, seriam necessários acesso à ABI do modelo, controle sobre o runtime de inferência e avaliação de distorção/qualidade após quantização. Para aproximar a seleção do ótimo de knapsack, o algoritmo guloso pode ser substituído por programação dinâmica ou seleção submodular; isso aumenta custo e complexidade.

## Referências

[1] [Zandieh et al., *TurboQuant: Online Vector Quantization with Near-optimal Distortion Rate*](https://arxiv.org/abs/2504.19874).

[2] [Google Research, *TurboQuant: Redefining AI efficiency with extreme compression*](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/).
