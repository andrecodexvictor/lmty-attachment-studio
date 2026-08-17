import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const attachmentArtifacts = mysqlTable("attachmentArtifacts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }).notNull(),
  version: varchar("version", { length: 32 }).notNull(),
  manifest: text("manifest"),
  policy: text("policy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const attachmentDatasets = mysqlTable("attachmentDatasets", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  format: mysqlEnum("format", ["JSONL", "CSV", "manual"]).notNull(),
  domain: varchar("domain", { length: 255 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  records: int("records").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const attachmentTraces = mysqlTable("attachmentTraces", {
  id: varchar("id", { length: 64 }).primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  route: text("route").notNull(),
  score: int("score").notNull(),
  latencyMs: int("latencyMs").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const attachmentCandidates = mysqlTable("attachmentCandidates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  attachmentId: varchar("attachmentId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  quality: int("quality").notNull(),
  tokens: int("tokens").notNull(),
  complexity: int("complexity").notNull(),
  reliability: int("reliability").notNull(),
  status: mysqlEnum("status", ["pareto", "dominated"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
