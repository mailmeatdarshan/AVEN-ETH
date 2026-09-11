import crypto from "crypto";

/**
 * Small shared utilities used across the app. The actual blockchain
 * simulation (hashing, mining, chain verification) lives in
 * services/blockchainService.js — this file just holds generic
 * helpers that aren't specific to that concern.
 */

export function nextId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function formatEth(amount, token = "USDC") {
  return `${Number(amount).toFixed(4)} ${token}`;
}
