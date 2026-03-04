import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

function createPrismaClient() {
  const dbUrl =
    process.env.DATABASE_URL?.replace("file:", "") ?? "./prisma/dev.db";
  const dbPath = path.isAbsolute(dbUrl)
    ? dbUrl
    : path.join(process.cwd(), dbUrl);
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter });
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof createPrismaClient> | undefined;
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
