# LMTY Attachment Studio

O **LMTY Attachment Studio** é a superfície operacional do projeto Let Me Tune You. A aplicação permite ingerir datasets JSONL/CSV, compilar attachments de especialização com extensão exata `.lmty`, operar sessões MAL, visualizar a fronteira de Pareto, inspecionar traces e diagnosticar a camada de abstração.

> O Studio mede propriedades verificáveis do *harness* — política, contexto, memória, tools, verificadores e traces. Ele não afirma modificar os pesos internos de um modelo fechado nem medir inteligência geral de um LLM.

## Capacidades

| Área | Entrega |
|---|---|
| Ingestão | Dataset JSONL/CSV persistente e metadados de domínio/rótulo. |
| Compilação | Domínio, contexto, tools permitidas, qualidade-alvo e artifact `.lmty`. |
| MAL | Sessões consecutivas com capability boundary, estado e trace_id. |
| Contexto | Matriz de relevância, seleção top-k, janelas por layer e compressão externa. |
| Pareto | Candidates explícitos com qualidade, tokens, complexidade e confiabilidade. |
| Abstração | Grafo de controle, invariantes estruturais, diagnóstico e relatórios de cenários. |

## Início rápido

```bash
pnpm install
pnpm test
pnpm check
pnpm build
pnpm dev
```

O ambiente usa uma aplicação React/TypeScript, backend tRPC e Drizzle. A interface pública é iniciada pela rota raiz e contém Dashboard, Dataset Ingest, Attachment Compiler, MAL Live Session, Memory & Context, Abstraction Graph, Pareto Frontier, Traces & Reports e Artifact Inspector.

## CLI

```bash
# Política externa de contexto
pnpm lmty:context -- --artifact frontend.lmty --bits 4 --budget 640

# Diagnóstico e grafo da camada de abstração
pnpm lmty:abstraction -- diagnose --budget 640 --bits 4
pnpm lmty:abstraction -- graph --format mermaid

# Cenários e busca de configuração
pnpm lmty:scenarios
pnpm lmty:optimize-abstraction
```

Os comandos escrevem artefatos reproduzíveis em `reports/`, incluindo `abstraction_scenarios.json`, `abstraction_optimization.json`, `final_abstraction_diagnosis.json` e o grafo Mermaid/PNG.

## Matemática e critérios

O funcionamento matemático está detalhado em [docs/MATEMATICA_LMTY_TRES_NIVEIS.md](docs/MATEMATICA_LMTY_TRES_NIVEIS.md). O contrato de aceitação estrutural está em [docs/ABSTRACTION_ACCEPTANCE.md](docs/ABSTRACTION_ACCEPTANCE.md), e a execução mais recente em [docs/ABSTRACTION_RUN_REPORT.md](docs/ABSTRACTION_RUN_REPORT.md).

O sistema usa memória externa, não acesso implícito ao KV cache interno. A inspiração em TurboQuant se limita à política de compactação e às métricas sobre vetores externos; acesso ao KV cache de um modelo fechado requer ABI oficial do provedor.[1] [2]

## Qualidade

O projeto possui testes Vitest para store, contrato de CLI, grafo de abstração e transformação Pareto. A validação mais recente contém **9 testes aprovados**, checagem TypeScript e build de produção bem-sucedidos.

## Continuidade com o POC

O [POC LMTY](https://github.com/andrecodexvictor/lmty-poc) contém o runtime Python L0/L1, kernels leves em C/Rust, benchmark de coding, casos de uso MAL, auditoria McCabe e relatórios técnicos. O Studio torna esses conceitos visíveis e gerenciáveis em uma aplicação web.

## Referências

[1] [Zandieh et al., *TurboQuant: Online Vector Quantization with Near-optimal Distortion Rate*](https://arxiv.org/abs/2504.19874).

[2] [Google Research, *TurboQuant: Redefining AI efficiency with extreme compression*](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/).
