import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import type { PrismaClient as PrismaClientType } from "../generated/prisma/client.js";

let prismaClient: PrismaClientType | undefined;

/**
 * Membuat Prisma Client secara lazy.
 * Dengan begitu server dan endpoint /health tetap bisa dijalankan sebelum
 * koneksi Neon diisi dan sebelum Prisma Client di-generate.
 */
export async function getPrisma(): Promise<PrismaClientType> {
  if (prismaClient) return prismaClient;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL belum diatur. Salin .env.example menjadi .env dan isi koneksi Neon.");
  }

  const { PrismaClient } = await import("../generated/prisma/client.js");
  const adapter = new PrismaNeon({ connectionString });
  prismaClient = new PrismaClient({ adapter });
  return prismaClient;
}
