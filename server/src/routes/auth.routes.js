import crypto from "crypto";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { db, publicUser, saveToDisk } from "../data/store.js";
import { isNeonConfigured, sql, persistUser, rowToUser } from "../data/neon.js";
import { JWT_SECRET, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  let user = null;

  // 1. If Neon is configured, query Neon DB directly to ensure latest credentials
  if (isNeonConfigured && sql) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const rows = await sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${cleanEmail});`;
        if (rows.length > 0) {
          user = rowToUser(rows[0]);
          // Sync into local memory collection
          const existingIdx = db.users.rows.findIndex((u) => u.email.toLowerCase() === cleanEmail);
          if (existingIdx >= 0) {
            db.users.rows[existingIdx] = user;
          } else {
            db.users.rows.push(user);
          }
          saveToDisk();
          break;
        }
      } catch (err) {
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 400 * attempt));
        }
      }
    }
  }

  // 2. If not found in Neon or Neon was unreachable, check local store
  if (!user) {
    user = db.users.findOne((u) => u.email.toLowerCase() === cleanEmail);
  }

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: "12h" });
  res.json({ token, user: publicUser(user) });
});

router.post("/register", async (req, res) => {
  const { name, email, password, role, title, skills } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  let existing = null;

  if (isNeonConfigured && sql) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const rows = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${cleanEmail});`;
        if (rows.length > 0) {
          existing = rows[0];
          break;
        }
      } catch (err) {
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 400 * attempt));
        }
      }
    }
  }

  if (!existing) {
    existing = db.users.findOne((u) => u.email.toLowerCase() === cleanEmail);
  }

  if (existing) {
    return res.status(400).json({ error: "An account with this email already exists." });
  }

  const cleanRole = role === "CLIENT" ? "CLIENT" : "FREELANCER";
  const initials = name
    .trim()
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AV";

  const randomHex = crypto.randomBytes(20).toString("hex");
  const walletAddress = `0x${randomHex}`;
  const initialBalance = cleanRole === "CLIENT" ? 15.0 : 0.0;

  const newUser = {
    id: `user_${cleanRole.toLowerCase()}_${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    password,
    role: cleanRole,
    avatar: initials,
    walletAddress,
    walletBalance: initialBalance,
    title: title?.trim() || (cleanRole === "CLIENT" ? "Engineering Lead & Client" : "Full-Stack Protocol Contributor"),
    skills: Array.isArray(skills) && skills.length ? skills : ["Solidity", "TypeScript", "React", "Node.js"],
    hourlyRate: cleanRole === "FREELANCER" ? 0.012 : undefined,
    profileCompleted: false,
    createdAt: new Date().toISOString(),
  };

  db.users.rows.push(newUser);
  saveToDisk();

  if (isNeonConfigured) {
    try {
      await persistUser(newUser);
    } catch (err) {
      console.error("[Neon DB] Registration persist failed:", err.message);
    }
  }

  const token = jwt.sign({ sub: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: "12h" });
  res.json({ token, user: publicUser(newUser) });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
