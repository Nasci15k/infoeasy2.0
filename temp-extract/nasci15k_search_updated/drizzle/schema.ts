import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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

/**
 * Search queries history table
 */
export const searchQueries = mysqlTable("searchQueries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  searchType: varchar("searchType", { length: 50 }).notNull(), // 'cpf', 'cnpj', 'email', 'phone', 'plate', 'cep', 'name'
  searchValue: varchar("searchValue", { length: 255 }).notNull(),
  results: json("results"),
  status: mysqlEnum("status", ["success", "error", "pending"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  executionTime: int("executionTime"), // milliseconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SearchQuery = typeof searchQueries.$inferSelect;
export type InsertSearchQuery = typeof searchQueries.$inferInsert;

/**
 * API endpoints configuration
 */
export const apiEndpoints = mysqlTable("apiEndpoints", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // 'serasa', 'spc', 'detran', etc
  endpoint: varchar("endpoint", { length: 500 }).notNull(),
  method: varchar("method", { length: 10 }).default("GET").notNull(),
  parameterName: varchar("parameterName", { length: 50 }).notNull(), // 'cpf', 'email', etc
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiEndpoint = typeof apiEndpoints.$inferSelect;
export type InsertApiEndpoint = typeof apiEndpoints.$inferInsert;
