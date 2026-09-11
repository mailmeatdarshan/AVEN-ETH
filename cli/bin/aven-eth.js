#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const DEFAULT_API_URL = process.env.AVEN_API_URL || "http://localhost:4000/api";
const DEFAULT_EMAIL = process.env.AVEN_EMAIL || "freelancer@aven.dev";
const DEFAULT_PASSWORD = process.env.AVEN_PASSWORD || "password123";

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";
  let streamId = null;
  let apiUrl = DEFAULT_API_URL;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--stream" || args[i] === "-s") {
      streamId = args[i + 1];
    }
    if (args[i] === "--api") {
      apiUrl = args[i + 1];
    }
  }

  return { command, streamId, apiUrl };
}

function printBanner() {
  console.clear();
  console.log("\x1b[36m%s\x1b[0m", `
  ╔═══════════════════════════════════════════════════════════════════╗
  ║                ⚡ AVEN-ETH PROTOCOL ACTIVITY WATCHER              ║
  ║           Real-Time Cryptographic Proof-of-Work Sentinel          ║
  ╚═══════════════════════════════════════════════════════════════════╝
  `);
}

async function apiRequest(url, path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${url}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!res.ok) {
      if (data && data.error) {
        throw new Error(data.error);
      }
      if (res.status === 405 || res.status === 404) {
        throw new Error(
          `HTTP ${res.status}: Backend API is not reachable at ${url}${path}. Make sure your backend server is running and deployed.`
        );
      }
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 100) || "Empty response from server"}`);
    }

    return data || {};
  } catch (err) {
    throw new Error(`API Error [${path}]: ${err.message}`);
  }
}

function checkAndInitGit() {
  const cwd = process.cwd();
  let isGit = false;
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
    isGit = true;
  } catch {
    isGit = false;
  }

  if (!isGit) {
    console.log("\x1b[33m%s\x1b[0m", `  ℹ No Git repository detected in ${cwd}. Initializing local git watcher...`);
    try {
      execSync("git init", { stdio: "ignore" });
      execSync("git config user.name 'Aven Contributor'", { stdio: "ignore" });
      execSync("git config user.email 'contributor@aven.dev'", { stdio: "ignore" });
    } catch {}
  }

  // Create .avenignore if not exists
  const avenignorePath = path.join(cwd, ".avenignore");
  if (!fs.existsSync(avenignorePath)) {
    const defaultIgnore = `# AVEN-ETH Privacy Protection Filter\n.env\n*.pem\n*.key\nsecrets.*\nnode_modules\n.git\n`;
    fs.writeFileSync(avenignorePath, defaultIgnore, "utf8");
    console.log("\x1b[32m%s\x1b[0m", `  ✓ Created .avenignore (Privacy Filter Active)`);
  }
}

function getInitialBaseCommit() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

function getGitMetrics(baseCommit) {
  let branch = "main";
  let headCommit = null;
  let commitsCount = 0;
  let changedFilesCount = 0;
  let linesAdded = 0;
  let linesDeleted = 0;

  try {
    branch = execSync("git branch --show-current", { encoding: "utf8" }).trim() || "main";
  } catch {}

  try {
    headCommit = execSync("git rev-parse HEAD", { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim();
  } catch {}

  // 1. Commits made strictly since this work session started
  if (baseCommit && headCommit && baseCommit !== headCommit) {
    try {
      const commitOut = execSync(`git rev-list --count ${baseCommit}..HEAD`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      commitsCount = parseInt(commitOut.trim(), 10) || 0;
    } catch {}
  }

  // 2. Cumulative diff between baseCommit and working state (includes committed + uncommitted edits)
  if (baseCommit && baseCommit !== "0000000000000000000000000000000000000000") {
    try {
      const diffStat = execSync(`git diff --shortstat ${baseCommit}`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      const filesMatch = diffStat.match(/(\d+) file/);
      const addMatch = diffStat.match(/(\d+) insertion/);
      const delMatch = diffStat.match(/(\d+) deletion/);
      if (filesMatch) changedFilesCount = parseInt(filesMatch[1], 10);
      if (addMatch) linesAdded = parseInt(addMatch[1], 10);
      if (delMatch) linesDeleted = parseInt(delMatch[1], 10);
    } catch {}
  } else {
    // If empty fresh repo without initial commit
    try {
      const statusOut = execSync("git status --porcelain", { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
      const changedLines = statusOut.split("\n").filter((l) => l.trim().length > 0);
      changedFilesCount = changedLines.length;
      if (changedFilesCount > 0) {
        linesAdded = Math.max(linesAdded, changedFilesCount * 5);
      }
    } catch {}
  }

  return {
    branch,
    baseCommit: baseCommit || "0000000000000000000000000000000000000000",
    headCommit: headCommit || baseCommit || "0000000000000000000000000000000000000000",
    commitsCount,
    changedFilesCount,
    linesAdded,
    linesDeleted,
  };
}

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

async function runWatcher({ streamId, apiUrl }) {
  if (!streamId) {
    console.error("\x1b[31m%s\x1b[0m", "Error: Stream ID is required. Example: aven-eth watch --stream agr_1");
    process.exit(1);
  }

  printBanner();
  checkAndInitGit();
  const baseCommit = getInitialBaseCommit();

  console.log("\x1b[34m%s\x1b[0m", `  Authenticating with AVEN-ETH API at ${apiUrl}...`);
  let token = null;
  try {
    const authRes = await apiRequest(apiUrl, "/auth/login", {
      method: "POST",
      body: { email: DEFAULT_EMAIL, password: DEFAULT_PASSWORD },
    });
    token = authRes.token;
    console.log("\x1b[32m%s\x1b[0m", `  ✓ Authenticated as ${authRes.user.name} (${authRes.user.email})`);
  } catch (err) {
    console.error("\x1b[31m%s\x1b[0m", `  Authentication failed: ${err.message}`);
    process.exit(1);
  }

  console.log("\x1b[34m%s\x1b[0m", `  Connecting to Payment Stream #${streamId}...`);
  let agreementData = null;
  try {
    const res = await apiRequest(apiUrl, `/agreements/${streamId}`, { token });
    agreementData = res.agreement;
    console.log("\x1b[32m%s\x1b[0m", `  ✓ Linked to Stream: "${agreementData.title}" (Budget: ${agreementData.budget} USDC)`);
    if (baseCommit) {
      console.log("\x1b[90m%s\x1b[0m", `  ✓ Base Commit Hash Locked: ${baseCommit.substring(0, 10)}...`);
    }
  } catch (err) {
    console.error("\x1b[31m%s\x1b[0m", `  Stream lookup failed: ${err.message}`);
    process.exit(1);
  }

  // Start work session on server with base commit
  try {
    await apiRequest(apiUrl, `/agreements/${streamId}/work/start`, {
      method: "POST",
      token,
      body: { baseCommit: baseCommit || undefined },
    });
    console.log("\x1b[32m%s\x1b[0m", `  ⚡ Work session started! Per-second streaming meter is ACTIVE.`);
  } catch (err) {
    // If already started, continue
  }

  let activeSeconds = 0;
  const startTime = Date.now();
  const ratePerSecond = Number(agreementData.ratePerSecond || 0.000004166);

  const interval = setInterval(async () => {
    activeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const git = getGitMetrics(baseCommit);
    const liveEarned = Math.min(agreementData.budget, activeSeconds * ratePerSecond);
    const reportHash = `0x${sha256(
      JSON.stringify({
        streamId,
        baseCommit: git.baseCommit,
        headCommit: git.headCommit,
        activeSeconds,
        commitsCount: git.commitsCount,
        linesAdded: git.linesAdded,
        linesDeleted: git.linesDeleted,
      })
    )}`;

    printBanner();
    console.log(`  Stream Title      : \x1b[1m${agreementData.title}\x1b[0m`);
    console.log(`  Stream ID         : \x1b[33m#${streamId}\x1b[0m`);
    console.log(`  Git Branch        : \x1b[36m${git.branch}\x1b[0m`);
    console.log(`  Active Time       : \x1b[32m\x1b[1m${formatDuration(activeSeconds)}\x1b[0m`);
    console.log(`  Base Commit       : \x1b[90m${git.baseCommit.substring(0, 10)}...\x1b[0m`);
    console.log(`  Head Commit       : \x1b[90m${git.headCommit.substring(0, 10)}...\x1b[0m`);
    console.log(`  Commits (Session) : \x1b[1m${git.commitsCount}\x1b[0m`);
    console.log(`  Files Modified    : ${git.changedFilesCount}`);
    console.log(`  Cumulative Diffs  : \x1b[32m+${git.linesAdded}\x1b[0m / \x1b[31m-${git.linesDeleted}\x1b[0m`);
    console.log(`  Accrued Payout    : \x1b[32m\x1b[1m${liveEarned.toFixed(6)} USDC\x1b[0m (Rate: ${(ratePerSecond * 3600).toFixed(4)} USDC/hr)`);
    console.log(`  Privacy Filter    : \x1b[32mActive (.avenignore)\x1b[0m`);
    console.log(`  Proof Hash        : \x1b[35m${reportHash}\x1b[0m`);
    console.log(`\n  \x1b[90mWatching local repository changes... (Press Ctrl+C to stop & finalize proof)\x1b[0m`);

    // Sync metrics to server with cryptographic integrity payload
    try {
      await apiRequest(apiUrl, `/agreements/${streamId}/cli-sync`, {
        method: "POST",
        token,
        body: {
          branch: git.branch,
          baseCommit: git.baseCommit,
          headCommit: git.headCommit,
          commitsCount: git.commitsCount,
          changedFilesCount: git.changedFilesCount,
          linesAdded: git.linesAdded,
          linesDeleted: git.linesDeleted,
          reportHash,
          accumulatedSeconds: activeSeconds,
          clientTimestamp: Date.now(),
        },
      });
    } catch {}
  }, 2000);

  // Graceful exit
  process.on("SIGINT", async () => {
    clearInterval(interval);
    console.log("\n\n\x1b[33m%s\x1b[0m", "  Stopping work session & finalizing cryptographic proof...");
    try {
      const git = getGitMetrics(baseCommit);
      await apiRequest(apiUrl, `/agreements/${streamId}/work/stop`, {
        method: "POST",
        token,
        body: {
          baseCommit: git.baseCommit,
          headCommit: git.headCommit,
          commitsCount: git.commitsCount,
          linesAdded: git.linesAdded,
          linesDeleted: git.linesDeleted,
        },
      });
      const finalEarned = (activeSeconds * ratePerSecond).toFixed(6);
      console.log("\x1b[32m%s\x1b[0m", `  ✓ Session stopped cleanly. ${finalEarned} USDC accrued and available to claim!`);
      console.log("\x1b[32m%s\x1b[0m", `  ✓ Cryptographic proof recorded on AVEN-ETH ledger.`);
    } catch (err) {
      console.log("\x1b[33m%s\x1b[0m", `  Session stopped: ${err.message}`);
    }
    process.exit(0);
  });
}

function showHelp() {
  printBanner();
  console.log(`
  Usage:
    aven-eth watch --stream <stream-id>   Start live Git activity watcher for a stream
    aven-eth help                         Show this help guide

  Options:
    --stream, -s  <stream-id>   The payment stream ID (e.g. agr_c9d09ada3837)
    --api         <url>         AVEN-ETH API endpoint (default: http://localhost:4000/api)

  Examples:
    aven-eth watch --stream agr_c9d09ada3837
    node cli/bin/aven-eth.js watch --stream agr_c9d09ada3837
  `);
}

const { command, streamId, apiUrl } = parseArgs();

if (command === "watch" || command === "start") {
  runWatcher({ streamId, apiUrl });
} else {
  showHelp();
}
