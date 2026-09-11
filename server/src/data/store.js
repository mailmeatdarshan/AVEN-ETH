import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as seed from "./seed.js";
import { blockchain, resetBlockchain } from "../services/blockchainService.js";

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
  } catch (err) {
    // Non-fatal fallback
  }
}

class Collection {
  constructor(initial) {
    this.rows = deepClone(initial || []);
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
    return deepClone(row);
  }
  update(id, patch) {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.rows[idx] = { ...this.rows[idx], ...patch };
    saveToDisk();
    return deepClone(this.rows[idx]);
  }
}

function loadInitialData() {
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

const initialData = loadInitialData();

export const db = {
  users: new Collection(initialData.users),
  agreements: new Collection(initialData.agreements),
  workSessions: new Collection(initialData.workSessions),
  submissions: new Collection(initialData.submissions),
  attestations: new Collection(initialData.attestations),
  transactions: new Collection(initialData.transactions),
  notifications: new Collection(initialData.notifications),
};

export function resetDb() {
  resetBlockchain();
  db.users = new Collection(seed.users);
  db.agreements = new Collection(seed.agreements);
  db.workSessions = new Collection(seed.workSessions);
  db.submissions = new Collection(seed.submissions);
  db.attestations = new Collection(seed.attestations || []);
  db.transactions = new Collection(seed.transactions || []);
  db.notifications = new Collection(seed.notifications || []);
  saveToDisk();
}

export function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}
