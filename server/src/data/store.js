import "../env.js";
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

export function saveToDisk() {
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
      persistUser(row).catch((err) => {
        console.error(`[Neon DB] persistUser error for ${row.email}:`, err.message);
      });
    }
    return deepClone(row);
  }
  update(id, patch) {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.rows[idx] = { ...this.rows[idx], ...patch };
    saveToDisk();
    if (this.name === "users" && isNeonConfigured && persistenceEnabled) {
      persistUser(this.rows[idx]).catch((err) => {
        console.error(`[Neon DB] persistUser update error for ${this.rows[idx]?.email}:`, err.message);
      });
    }
    return deepClone(this.rows[idx]);
  }
}

async function loadInitialData() {
  let loadedUsers = [];
  let loadedState = null;
  let fromNeon = false;

  if (persistenceEnabled && isNeonConfigured) {
    try {
      await initNeon(seed);
      const [neonUsers, neonAppState] = await Promise.all([
        fetchAllUsers(),
        fetchAllAppState(),
      ]);

      if (Array.isArray(neonUsers) && neonUsers.length > 0) {
        loadedUsers = neonUsers;
        loadedState = neonAppState;
        fromNeon = true;
      }
    } catch (err) {
      console.warn("[Neon DB] Fallback to local store:", err.message);
    }
  }

  const targetFile = fs.existsSync(DB_FILE) ? DB_FILE : (fs.existsSync(LOCAL_DB_FILE) ? LOCAL_DB_FILE : null);
  let fileData = null;
  if (targetFile) {
    try {
      const raw = fs.readFileSync(targetFile, "utf8");
      fileData = JSON.parse(raw);
    } catch {}
  }

function mergeById(listA = [], listB = []) {
  const map = new Map();
  if (Array.isArray(listB)) {
    for (const item of listB) {
      if (item && item.id) map.set(item.id, item);
    }
  }
  if (Array.isArray(listA)) {
    for (const item of listA) {
      if (item && item.id) map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

function mergeChain(chainA = [], chainB = []) {
  const map = new Map();
  if (Array.isArray(chainB)) {
    for (const block of chainB) {
      if (block && block.blockNumber != null) map.set(block.blockNumber, block);
    }
  }
  if (Array.isArray(chainA)) {
    for (const block of chainA) {
      if (block && block.blockNumber != null) map.set(block.blockNumber, block);
    }
  }
  const merged = Array.from(map.values()).sort((a, b) => a.blockNumber - b.blockNumber);
  return merged.length > 0 ? merged : blockchain.chain;
}

  if (fromNeon) {
    // If local file had extra users not in Neon, merge them
    if (Array.isArray(fileData?.users)) {
      for (const fu of fileData.users) {
        if (!loadedUsers.some((nu) => nu.email.toLowerCase() === fu.email.toLowerCase())) {
          loadedUsers.push(fu);
          persistUser(fu).catch(() => {});
        }
      }
    }

    const mergedChain = mergeChain(loadedState?.blockchain_chain, fileData?.chain);
    blockchain.loadChain(mergedChain);

    const merged = {
      users: loadedUsers,
      agreements: mergeById(loadedState?.agreements, fileData?.agreements),
      workSessions: mergeById(loadedState?.workSessions, fileData?.workSessions),
      submissions: mergeById(loadedState?.submissions, fileData?.submissions),
      attestations: mergeById(loadedState?.attestations, fileData?.attestations),
      transactions: mergeById(loadedState?.transactions, fileData?.transactions),
      notifications: mergeById(loadedState?.notifications, fileData?.notifications),
      chain: blockchain.chain,
    };

    // Cache the loaded Neon data to disk immediately so local file store is always fully in sync
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(merged, null, 2), "utf8");
    } catch {}

    // Synchronize merged state back to Neon so Neon holds the complete union as well
    if (isNeonConfigured) {
      persistAppState("agreements", merged.agreements).catch(() => {});
      persistAppState("workSessions", merged.workSessions).catch(() => {});
      persistAppState("submissions", merged.submissions).catch(() => {});
      persistAppState("attestations", merged.attestations).catch(() => {});
      persistAppState("transactions", merged.transactions).catch(() => {});
      persistAppState("notifications", merged.notifications).catch(() => {});
      persistAppState("blockchain_chain", merged.chain).catch(() => {});
    }

    return merged;
  }

  if (persistenceEnabled && fileData && Array.isArray(fileData.users) && fileData.users.length > 0) {
    if (Array.isArray(fileData.chain) && fileData.chain.length > 0) {
      blockchain.loadChain(fileData.chain);
    }
    return {
      users: fileData.users,
      agreements: Array.isArray(fileData.agreements) ? fileData.agreements : (seed.agreements || []),
      workSessions: Array.isArray(fileData.workSessions) ? fileData.workSessions : (seed.workSessions || []),
      submissions: Array.isArray(fileData.submissions) ? fileData.submissions : (seed.submissions || []),
      attestations: Array.isArray(fileData.attestations) ? fileData.attestations : (seed.attestations || []),
      transactions: Array.isArray(fileData.transactions) ? fileData.transactions : (seed.transactions || []),
      notifications: Array.isArray(fileData.notifications) ? fileData.notifications : (seed.notifications || []),
    };
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
  // NOTE: resetDb() is strictly an in-memory reset for test isolation.
  // We intentionally do NOT call saveToDisk() here to prevent tests or resets from erasing real users!
}

export function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}
