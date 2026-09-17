import "./env.js";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import agreementsRoutes from "./routes/agreements.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import blockchainRoutes from "./routes/blockchain.routes.js";
import reputationRoutes from "./routes/reputation.routes.js";
import attestationsRoutes from "./routes/attestations.routes.js";
import walletRoutes from "./routes/wallet.routes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", mode: "SIMULATION", service: "Sidekick API" });
});

apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", usersRoutes);
apiRouter.use("/agreements", agreementsRoutes);
apiRouter.use("/transactions", transactionsRoutes);
apiRouter.use("/notifications", notificationsRoutes);
apiRouter.use("/dashboard", dashboardRoutes);
apiRouter.use("/blockchain", blockchainRoutes);
apiRouter.use("/reputation", reputationRoutes);
apiRouter.use("/attestations", attestationsRoutes);
apiRouter.use("/wallet", walletRoutes);

// Mount at both /api and / so it works with or without /api prefix in any environment
app.use("/api", apiRouter);
app.use("/", apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error. Please try again." });
});

export default app;
