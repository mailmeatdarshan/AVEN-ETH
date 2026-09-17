import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from current working directory, server directory, and repository root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
const dbUrl = process.env.DATABASE_URL;
export const isNeonConfigured = Boolean(dbUrl);

export const sql = isNeonConfigured ? neon(dbUrl) : null;

async function withRetry(fn, retries = 3, delayMs = 600, label = "Operation") {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) {
        console.error(`[Neon DB] ${label} failed after ${retries} attempts:`, err.message);
        throw err;
      }
      await new Promise((res) => setTimeout(res, delayMs * attempt));
    }
  }
}

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role,
    avatar: row.avatar || "",
    walletAddress: row.wallet_address || "",
    walletBalance: parseFloat(row.wallet_balance || 0),
    title: row.title || "",
    skills: Array.isArray(row.skills) ? row.skills : (row.skills ? (typeof row.skills === "string" ? JSON.parse(row.skills) : row.skills) : []),
    hourlyRate: row.hourly_rate != null ? parseFloat(row.hourly_rate) : undefined,
    profileCompleted: Boolean(row.profile_completed),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export async function initNeon(seedData = {}) {
  if (!sql) return false;
  try {
    await withRetry(async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(32) NOT NULL,
          avatar TEXT,
          wallet_address VARCHAR(66),
          wallet_balance NUMERIC DEFAULT 0.0,
          title VARCHAR(255),
          skills JSONB DEFAULT '[]'::jsonb,
          hourly_rate NUMERIC,
          profile_completed BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS app_state (
          key VARCHAR(64) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      // Seed default users if table is blank
      const userCount = await sql`SELECT COUNT(*)::int as count FROM users;`;
      if ((userCount[0]?.count || 0) === 0 && Array.isArray(seedData.users) && seedData.users.length > 0) {
        console.log("[Neon DB] Initializing seed users into Neon Postgres...");
        for (const u of seedData.users) {
          await persistUser(u);
        }
      }
    }, 3, 800, "initNeon");
    return true;
  } catch (err) {
    return false;
  }
}

export async function persistUser(user) {
  if (!sql || !user) return;
  const skillsJson = JSON.stringify(Array.isArray(user.skills) ? user.skills : []);
  try {
    await withRetry(async () => {
      await sql`
        INSERT INTO users (
          id, name, email, password, role, avatar, wallet_address, wallet_balance, title, skills, hourly_rate, profile_completed, created_at
        ) VALUES (
          ${user.id},
          ${user.name},
          ${user.email.toLowerCase()},
          ${user.password},
          ${user.role},
          ${user.avatar || null},
          ${user.walletAddress || null},
          ${user.walletBalance || 0},
          ${user.title || null},
          ${skillsJson}::jsonb,
          ${user.hourlyRate != null ? user.hourlyRate : null},
          ${Boolean(user.profileCompleted)},
          ${user.createdAt || new Date().toISOString()}
        )
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          password = EXCLUDED.password,
          role = EXCLUDED.role,
          avatar = EXCLUDED.avatar,
          wallet_address = EXCLUDED.wallet_address,
          wallet_balance = EXCLUDED.wallet_balance,
          title = EXCLUDED.title,
          skills = EXCLUDED.skills,
          hourly_rate = EXCLUDED.hourly_rate,
          profile_completed = EXCLUDED.profile_completed;
      `;
    }, 3, 600, `persistUser(${user.email})`);
  } catch (err) {
    // Non-fatal
  }
}

export async function fetchAllUsers() {
  if (!sql) return null;
  try {
    return await withRetry(async () => {
      const rows = await sql`SELECT * FROM users ORDER BY created_at ASC;`;
      return rows.map(rowToUser);
    }, 3, 600, "fetchAllUsers");
  } catch (err) {
    return null;
  }
}

export async function persistAppState(key, data) {
  if (!sql) return;
  const jsonStr = JSON.stringify(data);
  try {
    await withRetry(async () => {
      await sql`
        INSERT INTO app_state (key, data, updated_at)
        VALUES (${key}, ${jsonStr}::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE SET
          data = EXCLUDED.data,
          updated_at = NOW();
      `;
    }, 3, 600, `persistAppState(${key})`);
  } catch (err) {
    // Non-fatal
  }
}

export async function fetchAllAppState() {
  if (!sql) return null;
  try {
    return await withRetry(async () => {
      const rows = await sql`SELECT key, data FROM app_state;`;
      const map = {};
      for (const row of rows) {
        map[row.key] = row.data;
      }
      return map;
    }, 3, 600, "fetchAllAppState");
  } catch (err) {
    return null;
  }
}
