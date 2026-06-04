import { env } from "./config/env.js";
import { pool } from "./database/db.js";
import { buildApp } from "./app.js";

const app = await buildApp();

const shutdown = async () => {
  app.log.info("Shutting down server");
  await app.close();
  await pool.end();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

try {
  await app.listen({
    port: env.PORT,
    host: "0.0.0.0"
  });
} catch (error) {
  app.log.error(error);
  await pool.end();
  process.exit(1);
}
