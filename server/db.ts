import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// Run migrations on startup
async function runMigrations() {
  try {
    // Add status column to follows table with 'accepted' as default first
    // so existing follows remain visible
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'follows' AND column_name = 'status'
        ) THEN
          ALTER TABLE follows ADD COLUMN status TEXT DEFAULT 'accepted';
          UPDATE follows SET status = 'accepted' WHERE status IS NULL;
          ALTER TABLE follows ALTER COLUMN status SET NOT NULL;
          ALTER TABLE follows ALTER COLUMN status SET DEFAULT 'pending';
          RAISE NOTICE 'Migration: Added status column to follows table';
        END IF;
      END $$;
    `);
    console.log("[db] Migrations complete");
  } catch (error: any) {
    console.error("[db] Migration error:", error.message);
  }
}

// Run migrations asynchronously on module load
runMigrations();
