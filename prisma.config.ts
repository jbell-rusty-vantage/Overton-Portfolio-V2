import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 config. The runtime client uses a driver adapter (lib/db.ts);
// this datasource URL is only used by the Prisma CLI (migrate, studio, db execute).
// Migrations should use a direct (non-pooled) Neon connection: scripts/db-deploy.mjs
// derives one automatically and passes it as DATABASE_URL to `prisma migrate deploy`.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
});
