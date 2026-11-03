import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is missing in .env.local");
}
/**
 * Cache connection across Hot Module Reloads (HMR) in development.
 * Prevents exhausting Supabase connection pool limits.
 */
const globalForDb = globalThis;
// Supabase transaction pooler (port 6543 / pgbouncer=true) requires prepare: false
const client = globalForDb.conn ??
    postgres(connectionString, {
        prepare: false,
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
    });
if (process.env.NODE_ENV !== "production") {
    globalForDb.conn = client;
}
export const db = drizzle(client, { schema });
export { client };
export default db;
