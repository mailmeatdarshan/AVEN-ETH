import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as seed from "./seed.js";
import { blockchain, resetBlockchain } from "../services/blockchainService.js";
import {
  isNeonConfigured,
  initNeon,
  fetchAllUsers,
  persistUser,
  persistAppState,
  fetchAllAppState,
} from "./neon.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_DB_FILE = path.join(__dirname, "db.json");
const DB_FILE = process.env.VERCEL ? path.join("/tmp", "aven_db.json") : LOCAL_DB_FILE;

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

let persistenceEnabled = process.env.NODE_ENV !== "test";

function saveToDisk() {
  if (!persistenceEnabled) return;
  try {
    const dump = {
      users: db.users.all(),
      agreements: db.agreements.all(),
      workSessions: db.workSessions.all(),
      submissions: db.submissions.all(),
      attestations: db.attestations.all(),
      transactions: db.transactions.all(),
      notifications: db.notifications.all(),
      chain: blockchain.chain,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(dump, null, 2), "utf8");

    if (isNeonConfigured) {
      persistAppState("agreements", dump.agreements).catch(() => {});
      persistAppState("workSessions", dump.workSessions).catch(() => {});
      persistAppState("submissions", dump.submissions).catch(() => {});
      persistAppState("attestations", dump.attestations).catch(() => {});
      persistAppState("transactions", dump.transactions).catch(() => {});
      persistAppState("notifications", dump.notifications).catch(() => {});
      persistAppState("blockchain_chain", dump.chain).catch(() => {});
    }
  } catch (err) {
    // Non-fatal fallback
  }
}

class Collection {
  constructor(initial, name = "") {
    this.rows = deepClone(initial || []);
    this.name = name;
  }
  all() {
    return deepClone(this.rows);
  }
  find(predicate) {
    return deepClone(this.rows.filter(predicate));
  }
  findOne(predicate) {
    const row = this.rows.find(predicate);
    return row ? deepClone(row) : null;
  }
  findById(id) {
    return this.findOne((r) => r.id === id);
  }
  insert(row) {
    this.rows.push(row);
    saveToDisk();
    if (this.name === "users" && isNeonConfigured && persistenceEnabled) {
      persistUser(row).catch(() => {});
    }
    return deepClone(row);
  }
  update(id, patch) {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.rows[idx] = { ...this.rows[idx], ...patch };
    saveToDisk();
    if (this.name === "users" && isNeonConfigured && persistenceEnabled) {
      persistUser(this.rows[idx]).catch(() => {});
    }
    return deepClone(this.rows[idx]);
  }
}

async function loadInitialData() {
  if (persistenceEnabled && isNeonConfigured) {
    try {
      await initNeon(seed);
      const [neonUsers, neonAppState] = await Promise.all([
        fetchAllUsers(),
        fetchAllAppState(),
      ]);

      if (Array.isArray(neonUsers) && neonUsers.length > 0) {
        if (Array.isArray(neonAppState?.blockchain_chain) && neonAppState.blockchain_chain.length > 0) {
          blockchain.loadChain(neonAppState.blockchain_chain);
        }
        return {
          users: neonUsers,
          agreements: Array.isArray(neonAppState?.agreements) ? neonAppState.agreements : (seed.agreements || []),
          workSessions: Array.isArray(neonAppState?.workSessions) ? neonAppState.workSessions : (seed.workSessions || []),
          submissions: Array.isArray(neonAppState?.submissions) ? neonAppState.submissions : (seed.submissions || []),
          attestations: Array.isArray(neonAppState?.attestations) ? neonAppState.attestations : (seed.attestations || []),
          transactions: Array.isArray(neonAppState?.transactions) ? neonAppState.transactions : (seed.transactions || []),
          notifications: Array.isArray(neonAppState?.notifications) ? neonAppState.notifications : (seed.notifications || []),
        };
      }
    } catch (err) {
      console.warn("[Neon DB] Fallback to file store:", err.message);
    }
  }

  const targetFile = fs.existsSync(DB_FILE) ? DB_FILE : (fs.existsSync(LOCAL_DB_FILE) ? LOCAL_DB_FILE : null);
  if (persistenceEnabled && targetFile) {
    try {
      const raw = fs.readFileSync(targetFile, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users)) {
        if (Array.isArray(parsed.chain) && parsed.chain.length > 0) {
          blockchain.loadChain(parsed.chain);
        }
        return parsed;
      }
    } catch {}
  }
  return {
    users: seed.users,
    agreements: seed.agreements,
    workSessions: seed.workSessions,
    submissions: seed.submissions,
    attestations: seed.attestations || [],
    transactions: seed.transactions || [],
    notifications: seed.notifications || [],
  };
}

const initialData = await loadInitialData();

export const db = {
  users: new Collection(initialData.users, "users"),
  agreements: new Collection(initialData.agreements, "agreements"),
  workSessions: new Collection(initialData.workSessions, "workSessions"),
  submissions: new Collection(initialData.submissions, "submissions"),
  attestations: new Collection(initialData.attestations, "attestations"),
  transactions: new Collection(initialData.transactions, "transactions"),
  notifications: new Collection(initialData.notifications, "notifications"),
};

export function resetDb() {
  resetBlockchain();
  db.users = new Collection(seed.users, "users");
  db.agreements = new Collection(seed.agreements, "agreements");
  db.workSessions = new Collection(seed.workSessions, "workSessions");
  db.submissions = new Collection(seed.submissions, "submissions");
  db.attestations = new Collection(seed.attestations || [], "attestations");
  db.transactions = new Collection(seed.transactions || [], "transactions");
  db.notifications = new Collection(seed.notifications || [], "notifications");
  saveToDisk();
}

export function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}
