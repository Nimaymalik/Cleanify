import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { neon } from "@neondatabase/serverless";

// Ensure the DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in the environment variables.");
}

// Initialize the Neon connection
const sql = neon(process.env.DATABASE_URL);

// Configure Drizzle with the Neon connection and schema
export const db = drizzle(sql, { schema });
