import "./env.js";
import app from "./app.js";

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  Sidekick API (Simulation Mode) running on port ${PORT}\n`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ [PORT CONFLICT] Port ${PORT} is already occupied by another process or Docker container!`);
    console.error(`   Please stop the process on port ${PORT} (e.g. check "docker ps" or "lsof -i :${PORT}") or run with PORT=4001\n`);
    process.exit(1);
  } else {
    throw err;
  }
});

import("./data/store.js").then(({ saveToDisk }) => {
  const onExit = () => {
    try { saveToDisk(); } catch {}
    process.exit(0);
  };
  process.on("SIGINT", onExit);
  process.on("SIGTERM", onExit);
});

