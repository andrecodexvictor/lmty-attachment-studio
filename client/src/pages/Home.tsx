import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toParetoData } from "@/lib/pareto";
import { Activity, ArrowUpRight, Binary, Boxes, Braces, Check, ChevronRight, CircleDot, Clock3, Command, Database, FileJson2, Gauge, Layers3, LineChart, MemoryStick, Network, PanelLeft, Play, Plus, ScanSearch, ShieldCheck, Sparkles, TerminalSquare, Upload, WandSparkles } from "lucide-react";
import { ChangeEvent, useMemo, useState } from "react";
import { Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

type View = "overview" | "ingest" | "compile" | "mal" | "memory" | "pareto" | "traces" | "artifact";

const navigation: { id: View; label: string; icon: typeof Layers3 }[] = [
  { id: "overview", label: "Overview", icon: Layers3 },
  { id: "ingest", label: "Dataset Ingest", icon: Upload },
  { id: "compile", label: "Attachment Compiler", icon: WandSparkles },
  { id: "mal", label: "MAL Live Session", icon: Activity },
  { id: "memory", label: "Memory & Context", icon: MemoryStick },
  { id: "pareto", label: "Pareto Frontier", icon: LineChart },
  { id: "traces", label: "Traces & Reports", icon: ScanSearch },
  { id: "artifact", label: "Artifact Inspector", icon: FileJson2 },
];

const tools = ["browser", "test_runner", "typecheck", "filesystem", "visual_verify"];
const steps = ["Capability manifold", "Dataset validation", "Policy candidates", "Pareto selection", "Artifact packaging"];

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Gauge }) {
  return <div className="metric-card"><div className="metric-label"><span>{label}</span><Icon size={16} /></div><strong>{value}</strong><p>{detail}</p></div>;
}

function SectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="section-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function StatusPill({ children, tone = "mint" }: { children: React.ReactNode; tone?: "mint" | "violet" | "gold" | "slate" }) {
  return <span className={cn("status-pill", tone)}><i />{children}</span>;
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [datasetName, setDatasetName] = useState("security_incidents.jsonl");
  const [datasetDomain, setDatasetDomain] = useState("Security Operations");
  const [datasetLabel, setDatasetLabel] = useState("incident_response");
  const [records, setRecords] = useState(48);
  const [uploadBase64, setUploadBase64] = useState<string | null>(null);
  const [compileDomain, setCompileDomain] = useState("Security Operations");
  const [contextBudget, setContextBudget] = useState(640);
  const [qualityTarget, setQualityTarget] = useState(0.9);
  const [selectedTools, setSelectedTools] = useState(["filesystem", "test_runner", "typecheck"]);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [task, setTask] = useState("Investigar um bug de permissões e preparar regressão.");
  const [bits, setBits] = useState(4);

  const snapshot = trpc.lmty.snapshot.useQuery(undefined, { refetchInterval: 4_000 });
  const utils = trpc.useUtils();
  const ingest = trpc.lmty.ingest.useMutation({ onSuccess: () => { toast.success("Dataset ingested"); utils.lmty.snapshot.invalidate(); } });
  const ingestFile = trpc.lmty.ingestFile.useMutation({ onSuccess: () => { toast.success("Dataset stored and ingested"); utils.lmty.snapshot.invalidate(); } });
  const compile = trpc.lmty.compile.useMutation({ onSuccess: () => { toast.success("New .lmty artifact compiled"); utils.lmty.snapshot.invalidate(); setView("artifact"); } });
  const openSession = trpc.lmty.openSession.useMutation({ onSuccess: data => { setSessionId(data.id); toast.success("MAL session opened"); utils.lmty.snapshot.invalidate(); } });
  const runTask = trpc.lmty.runTask.useMutation({ onSuccess: () => { toast.success("Trace emitted"); utils.lmty.snapshot.invalidate(); } });
  const optimize = trpc.lmty.optimizeContext.useMutation();

  const data = snapshot.data;
  const attachment = data?.attachments[0];
  const traces = data?.traces ?? [];
  const paretoData = useMemo(() => toParetoData(data?.candidates ?? []), [data?.candidates]);
  const contextPlan = optimize.data;

  const toggleTool = (tool: string) => setSelectedTools(current => current.includes(tool) ? current.filter(item => item !== tool) : [...current, tool]);
  const readDataset = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const raw = await file.text();
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    const base64 = btoa(binary);
    const inferred = file.name.toLowerCase().endsWith(".csv") ? "CSV" : "JSONL";
    const count = raw.trim().split(/\r?\n/).filter(Boolean).length - (inferred === "CSV" ? 1 : 0);
    setDatasetName(file.name);
    setRecords(Math.max(1, count));
    setUploadBase64(base64);
    toast.message(`${file.name} analyzed locally`, { description: `${Math.max(1, count)} records detected · ${inferred}` });
  };
  const ingestDataset = () => {
    const format = datasetName.toLowerCase().endsWith(".csv") ? "CSV" : "JSONL";
    if (uploadBase64) return ingestFile.mutate({ name: datasetName, format, records, domain: datasetDomain, label: datasetLabel, contentBase64: uploadBase64 });
    return ingest.mutate({ name: datasetName, format: "manual", records, domain: datasetDomain, label: datasetLabel });
  };
  const startCompile = () => {
    setPipelineStep(1);
    const interval = window.setInterval(() => setPipelineStep(current => {
      if (current >= steps.length) { window.clearInterval(interval); return current; }
      return current + 1;
    }), 540);
    compile.mutate({ domain: compileDomain, contextBudget, tools: selectedTools, qualityTarget, datasetId: data?.datasets[0]?.id ?? "data_frontend" });
  };
  const sendTask = () => {
    if (!sessionId) return openSession.mutate({ attachmentId: attachment?.id ?? "att_frontend", enabledTools: selectedTools });
    runTask.mutate({ sessionId, task });
  };
  const runOptimizer = () => optimize.mutate({ contextBudget, quantizedBits: bits });

  return <div className="app-shell">
    <aside className={cn("sidebar", !sidebarOpen && "collapsed")}>
      <div className="brand"><div className="brand-mark"><Binary size={18} /></div>{sidebarOpen && <div><b>LMTY</b><span>Attachment Studio</span></div>}<button className="icon-button side-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle navigation"><PanelLeft size={16} /></button></div>
      <div className="workspace-card">{sidebarOpen && <><span>ACTIVE WORKSPACE</span><b>Frontier Lab</b></>}<div className="workspace-signal"><i /></div></div>
      <nav>{navigation.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setView(id)} className={cn("nav-item", view === id && "active")} title={label}><Icon size={17} />{sidebarOpen && <span>{label}</span>}{id === "mal" && sidebarOpen && <em>live</em>}</button>)}</nav>
      <div className="sidebar-footer">{sidebarOpen && <div><span>RUNTIME</span><b>B0 / B1 ready</b></div>}<ShieldCheck size={18} /></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="crumb"><span>Workspace</span><ChevronRight size={14} /><b>{navigation.find(item => item.id === view)?.label}</b></div><div className="topbar-actions"><StatusPill>Runtime online</StatusPill><button className="icon-button"><Command size={16} /></button><div className="avatar">FL</div></div></header>
      <div className="content-area">
        {view === "overview" && <>
          <SectionTitle eyebrow="LMTY CONTROL PLANE" title="Specialization, made operational." description="A precise control surface for compiling, evaluating and deploying model attachments." action={<Button onClick={() => setView("compile")} className="primary-action"><WandSparkles size={16} /> Compile attachment</Button>} />
          <section className="metrics-grid"><Metric label="Installed attachments" value={String(data?.attachments.length ?? "–").padStart(2, "0")} detail="2 stable · 1 candidate" icon={Boxes} /><Metric label="Quality index" value={data ? `${Math.round(data.metrics.quality * 100)}%` : "–"} detail="+2.4% versus baseline" icon={Gauge} /><Metric label="Reliability" value={data ? `${Math.round(data.metrics.reliability * 100)}%` : "–"} detail="Across held-out evaluation" icon={ShieldCheck} /><Metric label="Active MAL sessions" value={String(data?.metrics.activeSessions ?? 0).padStart(2, "0")} detail="Stateful attachment contexts" icon={Activity} /></section>
          <section className="overview-grid"><div className="panel attachments-panel"><div className="panel-head"><div><span className="eyebrow">REGISTRY</span><h2>Installed attachments</h2></div><button onClick={() => setView("artifact")} className="text-button">View registry <ArrowUpRight size={14} /></button></div><div className="attachment-list">{data?.attachments.map(item => <div className="attachment-row" key={item.id}><div className="artifact-icon"><Braces size={17} /></div><div className="attachment-name"><b>{item.name}</b><span>{item.domain} · v{item.version}</span></div><div className="mini-metric"><span>quality</span><b>{Math.round(item.quality * 100)}%</b></div><StatusPill tone="mint">ready</StatusPill></div>)}</div></div>
          <div className="panel runtime-panel"><div className="panel-head"><div><span className="eyebrow">LIVE SIGNAL</span><h2>Runtime posture</h2></div><StatusPill tone="violet">B0 / B1</StatusPill></div><div className="runtime-orbit"><div className="orbit-core"><Network size={22} /><b>φ</b><span>attachment</span></div></div><div className="runtime-legend"><span><i className="dot mint" />Context layer</span><span><i className="dot violet" />MAL state</span><span><i className="dot gold" />Verifiers</span></div></div></section>
        </>}

        {view === "ingest" && <>
          <SectionTitle eyebrow="DATASET INTAKE" title="Ingest evidence, not noise." description="Bring JSONL or CSV task data into the compiler, or author a focused manual example." />
            <section className="ingest-grid"><div className="panel intake-drop"><div className="drop-visual"><Upload size={28} /><div className="pulse-ring" /></div><h2>Dataset intake</h2><p>Drop a JSONL or CSV dataset. The intake parser derives a compact task count before it enters the attachment workflow.</p><label className="file-button"><Upload size={15} /> Select JSONL or CSV<input type="file" accept=".jsonl,.csv" onChange={readDataset} /></label><div className="file-meta"><FileJson2 size={17} /><span>{datasetName}</span><b>{records} records</b></div></div>
          <div className="panel intake-form"><span className="eyebrow">INGESTION METADATA</span><h2>Shape the dataset contract</h2><div className="field-grid"><div><Label>Dataset name</Label><Input value={datasetName} onChange={event => setDatasetName(event.target.value)} /></div><div><Label>Domain</Label><Input value={datasetDomain} onChange={event => setDatasetDomain(event.target.value)} /></div><div><Label>Label</Label><Input value={datasetLabel} onChange={event => setDatasetLabel(event.target.value)} /></div><div><Label>Task records</Label><Input type="number" value={records} onChange={event => setRecords(Number(event.target.value))} /></div></div><div className="manual-example"><span>MANUAL EXAMPLE</span><Textarea defaultValue={'{"task":"Validate evidence retention","domain":"Security Operations","label":"incident_response"}'} /></div><Button className="primary-action full" onClick={ingestDataset} disabled={ingest.isPending || ingestFile.isPending}><Database size={16} /> {ingest.isPending || ingestFile.isPending ? "Ingesting…" : "Ingest dataset"}</Button></div></section>
          <section className="panel table-panel"><div className="panel-head"><div><span className="eyebrow">CATALOG</span><h2>Available datasets</h2></div><StatusPill tone="slate">{data?.datasets.length ?? 0} sources</StatusPill></div><div className="data-table"><div className="table-row table-head"><span>Name</span><span>Format</span><span>Domain</span><span>Label</span><span>Records</span></div>{data?.datasets.map(item => <div className="table-row" key={item.id}><b>{item.name}</b><span><StatusPill tone="violet">{item.format}</StatusPill></span><span>{item.domain}</span><span>{item.label}</span><strong>{item.records}</strong></div>)}</div></section>
        </>}

        {view === "compile" && <>
          <SectionTitle eyebrow="ATTACHMENT COMPILER" title="Compile a new operating behavior." description="Turn validated evidence into a compact, versioned .lmty specialization." action={<StatusPill tone="gold">target B0 / B1</StatusPill>} />
          <section className="compiler-grid"><div className="panel compiler-form"><div className="form-section"><span className="eyebrow">01 / SPECIALIZATION</span><h2>Compiler inputs</h2><Label>Domain</Label><Input value={compileDomain} onChange={event => setCompileDomain(event.target.value)} /><div className="split-fields"><div><Label>Context budget <b>{contextBudget}</b></Label><input className="range" type="range" min="256" max="1536" step="32" value={contextBudget} onChange={event => setContextBudget(Number(event.target.value))} /></div><div><Label>Quality target <b>{Math.round(qualityTarget * 100)}%</b></Label><input className="range" type="range" min="0.7" max="0.98" step="0.01" value={qualityTarget} onChange={event => setQualityTarget(Number(event.target.value))} /></div></div></div><div className="form-section"><span className="eyebrow">02 / CAPABILITIES</span><h2>Allowed tools</h2><div className="tool-grid">{tools.map(tool => <button key={tool} className={cn("tool-toggle", selectedTools.includes(tool) && "selected")} onClick={() => toggleTool(tool)}><span>{selectedTools.includes(tool) && <Check size={13} />}</span>{tool}</button>)}</div></div><Button className="primary-action full" onClick={startCompile} disabled={compile.isPending}><WandSparkles size={16} /> {compile.isPending ? "Compiling…" : "Build .lmty artifact"}</Button></div>
          <div className="panel pipeline-panel"><div className="panel-head"><div><span className="eyebrow">EXECUTION TRACE</span><h2>Compilation pipeline</h2></div><StatusPill tone={pipelineStep >= steps.length ? "mint" : "violet"}>{pipelineStep >= steps.length ? "completed" : "ready"}</StatusPill></div><div className="pipeline">{steps.map((step, index) => <div key={step} className={cn("pipeline-step", pipelineStep > index && "done", pipelineStep === index + 1 && "current")}><div className="step-index">{pipelineStep > index ? <Check size={13} /> : `0${index + 1}`}</div><div><b>{step}</b><span>{index === 0 ? "Map task patterns" : index === 1 ? "Lock held-out split" : index === 2 ? "Generate compact policies" : index === 3 ? "Optimize quality × tokens" : "Write signed artifact"}</span></div><i /></div>)}</div><div className="compiler-note"><Sparkles size={17} /><p>The compiler is external-memory aware: its policy inherits the configured context window and allowed capability boundary.</p></div></div></section>
        </>}

        {view === "mal" && <>
          <SectionTitle eyebrow="MAL LIVE SESSION" title="Make specialization observable." description="Send consecutive tasks through one attachment session and inspect routing, capabilities and persistent state." action={<StatusPill tone={sessionId ? "mint" : "slate"}>{sessionId ? "session active" : "session idle"}</StatusPill>} />
          <section className="mal-grid"><div className="panel mal-console"><div className="console-head"><span><CircleDot size={14} /> MAL / session runtime</span><b>{sessionId ?? "not initialized"}</b></div><div className="console-body">{!sessionId ? <div className="console-empty"><Activity size={28} /><h3>Open a bounded session</h3><p>The session will preserve task count and enforce the selected capability boundary.</p></div> : <div className="console-state"><div><span>Persistent state</span><b>calls incrementing</b></div><div><span>Attachment</span><b>{attachment?.name}</b></div><div><span>Policy</span><b>behavioral-stateful</b></div></div>}<div className="task-composer"><Label>Consecutive task</Label><Textarea value={task} onChange={event => setTask(event.target.value)} /><Button className="primary-action full" onClick={sendTask} disabled={openSession.isPending || runTask.isPending}><Play size={15} /> {sessionId ? "Run next task" : "Open MAL session"}</Button></div></div></div>
          <div className="panel boundary-panel"><span className="eyebrow">CAPABILITY BOUNDARY</span><h2>Runtime access is explicit.</h2><p>Only tools allowed by the attachment policy are exposed to the current MAL session.</p><div className="capability-stack">{tools.map(tool => <div key={tool} className={cn("capability", selectedTools.includes(tool) && "enabled")}><span>{selectedTools.includes(tool) ? <Check size={14} /> : "–"}</span><b>{tool}</b><em>{selectedTools.includes(tool) ? "enabled" : "withheld"}</em></div>)}</div><div className="boundary-foot"><ShieldCheck size={16} /> No self-escalation beyond host permissions</div></div></section>
          <section className="panel trace-strip"><div className="panel-head"><div><span className="eyebrow">SESSION OUTPUT</span><h2>Latest traces</h2></div><button onClick={() => setView("traces")} className="text-button">Open trace panel <ArrowUpRight size={14} /></button></div>{traces.slice(0, 3).map(trace => <div className="trace-card" key={trace.id}><span className="trace-id">{trace.id}</span><b>{trace.route}</b><span>{trace.verifiers.join(" · ")}</span><strong>{Math.round(trace.score * 100)}%</strong><em>{trace.latencyMs} ms</em></div>)}{!traces.length && <div className="empty-inline">Run a task to emit the first trace.</div>}</section>
        </>}

        {view === "memory" && <>
          <SectionTitle eyebrow="CONTEXT CONTROL LAYER" title="Retain the signal. Compress the rest." description="An external-memory implementation inspired by TurboQuant for relevance-driven context selection. KV cache compression remains provider-dependent." action={<Button className="primary-action" onClick={runOptimizer} disabled={optimize.isPending}><MemoryStick size={16} /> {optimize.isPending ? "Optimizing…" : "Optimize context"}</Button>} />
          <section className="memory-grid"><div className="panel context-control"><span className="eyebrow">MEMORY POLICY</span><h2>Layered context window</h2><div className="policy-controls"><div><Label>Attachment budget <b>{contextBudget} tokens</b></Label><input className="range" type="range" min="256" max="1536" step="32" value={contextBudget} onChange={event => setContextBudget(Number(event.target.value))} /></div><div><Label>Quantized bits <b>{bits}-bit</b></Label><input className="range" type="range" min="2" max="8" step="1" value={bits} onChange={event => setBits(Number(event.target.value))} /></div></div><div className="layer-window">{Object.entries(contextPlan?.layers ?? { system: Math.round(contextBudget * 0.18), attachment: Math.round(contextBudget * 0.22), evidence: Math.round(contextBudget * 0.42), task: Math.round(contextBudget * 0.18) }).map(([key, value]) => <div key={key}><span>{key}</span><i style={{ width: `${(Number(value) / contextBudget) * 100}%` }} /><b>{String(value)}t</b></div>)}</div><div className="cli-command"><TerminalSquare size={17} /><code>lmty context optimize --artifact {attachment?.name ?? "frontend.lmty"} --bits {bits} --budget {contextBudget}</code></div></div>
          <div className="panel matrix-panel"><div className="panel-head"><div><span className="eyebrow">RELEVANCE MATRIX R</span><h2>Task × memory alignment</h2></div><StatusPill tone="violet">external-memory</StatusPill></div><div className="matrix">{(contextPlan?.relevanceMatrix ?? []).length ? <><div className="matrix-row matrix-header"><span>Memory item</span><span>visual_ui</span><span>debugging</span><span>performance</span></div>{(contextPlan?.relevanceMatrix ?? []).map(row => <div className="matrix-row" key={row.label}><b>{row.label}</b>{[row.visualUi, row.debugging, row.performance].map((score, index) => <span key={index} className="matrix-cell" style={{ "--heat": score } as React.CSSProperties}>{score}</span>)}</div>)}</> : <div className="matrix-empty">Run the optimizer to materialize R.</div>}</div></div></section>
          {contextPlan && <section className="memory-results"><Metric label="Compression ratio" value={`${contextPlan.metrics.compressionRatio}×`} detail={`${contextPlan.metrics.quantizedBits}-bit external vector policy`} icon={Binary} /><Metric label="Retained context" value={`${contextPlan.metrics.usedTokens}t`} detail={`${contextPlan.metrics.retainedItems} evidence items selected`} icon={MemoryStick} /><Metric label="Retained score" value={`${Math.round(contextPlan.metrics.retainedScore * 100)}%`} detail="Weighted relevance × recency × reliability" icon={Gauge} /><Metric label="Runtime mode" value="B0/B1" detail="No internal KV cache access assumed" icon={ShieldCheck} /></section>}
        </>}

        {view === "pareto" && <>
          <SectionTitle eyebrow="MULTI-OBJECTIVE SEARCH" title="Choose the right frontier." description="Every candidate exposes its quality, token budget and operational complexity as a transparent trade-off." />
          <section className="pareto-layout"><div className="panel chart-panel"><div className="panel-head"><div><span className="eyebrow">PARETO FRONTIER</span><h2>Quality × tokens × complexity</h2></div><StatusPill tone="gold">non-dominated candidates</StatusPill></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 20, right: 24, bottom: 24, left: 4 }}><XAxis dataKey="tokens" type="number" name="tokens" unit="t" stroke="#708090" tickLine={false} axisLine={false} /><YAxis dataKey="quality" type="number" name="quality" unit="%" stroke="#708090" tickLine={false} axisLine={false} domain={[70, 100]} /><ZAxis dataKey="complexity" type="number" range={[180, 560]} name="complexity" /><Tooltip cursor={{ strokeDasharray: "4 4" }} contentStyle={{ background: "#12221f", border: "1px solid #29423c", borderRadius: "12px", color: "#eaf4f0" }} /><Scatter data={paretoData} fill="#72e6bc" /></ScatterChart></ResponsiveContainer></div></div><div className="panel candidates-panel"><span className="eyebrow">CANDIDATES</span><h2>Optimization ledger</h2>{paretoData.map((candidate, index) => <div className="candidate" key={candidate.name}><span className="candidate-index">0{index + 1}</span><div><b>{candidate.name}</b><span>{candidate.tokens} tokens · C{candidate.complexity.toFixed(1)}</span></div><strong>{candidate.quality}%</strong></div>)}<div className="pareto-note"><LineChart size={17} /> A point stays on the frontier if no candidate improves every objective at once.</div></div></section>
        </>}

        {view === "traces" && <>
          <SectionTitle eyebrow="OBSERVABILITY" title="Every decision leaves evidence." description="Inspect route selection, verifiers, score and latency emitted by MAL sessions." />
          <section className="panel trace-table"><div className="table-row table-head traces-head"><span>trace_id</span><span>Route</span><span>Verifiers</span><span>Score</span><span>Latency</span></div>{traces.length ? traces.map(trace => <div key={trace.id} className="table-row traces-row"><code>{trace.id}</code><b>{trace.route}</b><span>{trace.verifiers.join(" · ")}</span><strong>{Math.round(trace.score * 100)}%</strong><em>{trace.latencyMs} ms</em></div>) : <div className="empty-table"><Clock3 size={22} />No traces yet. Use MAL Live Session to create an observable run.</div>}</section>
        </>}

        {view === "artifact" && <>
          <SectionTitle eyebrow="ARTIFACT INSPECTOR" title="A specialization you can inspect." description="Every compiled attachment is emitted as a portable .lmty artifact with explicit policy and evaluation surface." />
          <section className="artifact-layout"><div className="panel artifact-card"><div className="artifact-card-head"><div className="artifact-icon large"><Braces size={24} /></div><StatusPill>ready</StatusPill></div><h2>{attachment?.name ?? "new-specialization.lmty"}</h2><p>{attachment?.domain ?? "Specialization domain"} · v{attachment?.version ?? "0.1.0"}</p><div className="artifact-kpis"><div><span>Quality</span><b>{attachment ? Math.round(attachment.quality * 100) : 90}%</b></div><div><span>Reliability</span><b>{attachment ? Math.round(attachment.reliability * 100) : 94}%</b></div><div><span>Context</span><b>{attachment?.contextBudget ?? contextBudget}t</b></div></div><Button className="secondary-action full" onClick={() => toast.success("Artifact manifest copied to workspace")}>Export .lmty manifest</Button></div><div className="panel manifest-panel"><div className="panel-head"><div><span className="eyebrow">ARTIFACT CONTENTS</span><h2>Attachment contract</h2></div><StatusPill tone="violet">lmty-attachment/0.1</StatusPill></div><pre>{JSON.stringify({ name: attachment?.name ?? "new-specialization.lmty", version: attachment?.version ?? "0.1.0", abi: "lmty-attachment/0.1", minimum_access: "B0", preferred_backend: "behavioral-stateful", context_window: { policy: "layered", external_memory: "turboquant-inspired", kv_cache: "provider_abi_required" }, policy: { context_budget: attachment?.contextBudget ?? contextBudget, allowed_tools: attachment?.tools ?? selectedTools }, verification: ["typecheck", "scoped_tests", "task_specific"] }, null, 2)}</pre></div></section>
        </>}
      </div>
    </main>
  </div>;
}
