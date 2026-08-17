import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { lmtyStore } from "../lmtyStore";
import { storagePut } from "../storage";

export const lmtyRouter = router({
  snapshot: publicProcedure.query(() => lmtyStore.snapshot()),
  ingest: publicProcedure.input(z.object({ name: z.string().min(1), format: z.enum(["JSONL", "CSV", "manual"]), records: z.number().int().positive(), domain: z.string().min(1), label: z.string().min(1) })).mutation(({ input }) => lmtyStore.ingest(input)),
  ingestFile: publicProcedure.input(z.object({ name: z.string().min(1), format: z.enum(["JSONL", "CSV"]), records: z.number().int().positive(), domain: z.string().min(1), label: z.string().min(1), contentBase64: z.string().min(1) })).mutation(async ({ input }) => {
    const content = Buffer.from(input.contentBase64, "base64");
    const contentType = input.format === "CSV" ? "text/csv" : "application/x-ndjson";
    const stored = await storagePut(`lmty-datasets/${input.name}`, content, contentType);
    const dataset = lmtyStore.ingest({ name: input.name, format: input.format, records: input.records, domain: input.domain, label: input.label });
    return { ...dataset, storage: stored };
  }),
  compile: publicProcedure.input(z.object({ domain: z.string().min(1), contextBudget: z.number().int().min(128).max(4096), tools: z.array(z.string()).min(1), qualityTarget: z.number().min(0.5).max(0.99), datasetId: z.string().min(1) })).mutation(({ input }) => lmtyStore.compile(input)),
  openSession: publicProcedure.input(z.object({ attachmentId: z.string().min(1), enabledTools: z.array(z.string()) })).mutation(({ input }) => lmtyStore.openSession(input.attachmentId, input.enabledTools)),
  runTask: publicProcedure.input(z.object({ sessionId: z.string().min(1), task: z.string().min(1) })).mutation(({ input }) => lmtyStore.runTask(input.sessionId, input.task)),
  optimizeContext: publicProcedure.input(z.object({ contextBudget: z.number().int().min(256).max(8192), quantizedBits: z.number().int().min(2).max(16) })).mutation(({ input }) => lmtyStore.optimizeContext(input.contextBudget, input.quantizedBits)),
});
