import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

// One PrismaClient per server instance. Prisma 7 talks to Postgres through a
// driver adapter; on Vercel the pooled Neon URL (DATABASE_URL) is right for
// runtime traffic. Migrations use the direct URL (see scripts/db-deploy.mjs).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString, max: 5 });
  return new PrismaClient({ adapter });
}

// Admin modules may be imported by a fixture-only build without database credentials.
export const db = new Proxy({} as PrismaClient, {
  get(_target, key) {
    const client = globalForPrisma.prisma ??= createClient();
    const value = Reflect.get(client, key, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export * from "@/lib/generated/prisma/client";
