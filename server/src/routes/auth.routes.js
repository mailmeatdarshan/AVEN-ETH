import crypto from "crypto";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { db, publicUser } from "../data/store.js";
import { isNeonConfigured, sql, persistUser } from "../data/neon.js";
import { JWT_SECRET, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  let user = db.users.findOne((u) => u.email.toLowerCase() === cleanEmail);

  // If not found in cache and Neon is configured, check Neon DB directly
  if (!user && isNeonConfigured && sql) {
    try {
      const rows = await sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${cleanEmail});`;
      if (rows.length > 0) {
        const row = rows[0];
        const u = {
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
        db.users.insert(u);
        user = u;
      }
    } catch (_) {}
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
  let existing = db.users.findOne((u) => u.email.toLowerCase() === cleanEmail);

  if (!existing && isNeonConfigured && sql) {
    try {
      const rows = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${cleanEmail});`;
      if (rows.length > 0) existing = rows[0];
    } catch (_) {}
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

  const newUser = db.users.insert({
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
  });

  if (isNeonConfigured) {
    await persistUser(newUser);
  }

  const token = jwt.sign({ sub: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: "12h" });
  res.json({ token, user: publicUser(newUser) });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
