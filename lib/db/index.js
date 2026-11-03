import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

function sanitizeConnectionString(url) {
  if (!url) return "";
  try {
    new URL(url);
    return url;
  } catch {
    const match = url.match(/^(postgresql:\/\/)([^:]+):(.*)@([^:/]+)(:\d+)?\/(.+)$/);
    if (match) {
      const [, proto, user, pass, host, port, dbName] = match;
      return `${proto}${user}:${encodeURIComponent(decodeURIComponent(pass))}@${host}${port || ":5432"}/${dbName}`;
    }
    return url;
  }
}

const connectionString = sanitizeConnectionString(process.env.DATABASE_URL || "");

if (!connectionString) {
  console.warn("DATABASE_URL is not defined in environment variables.");
}

const globalForDb = globalThis;

const client =
  globalForDb.postgresClient ||
  postgres(connectionString, {
    prepare: false,
    ssl: "require",
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });
export * from "./schema.js";
