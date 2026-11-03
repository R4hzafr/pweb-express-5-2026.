import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  // Prisma CLI memakai koneksi DIRECT_URL agar migration tidak melalui pooler.
  datasource: {
    url: env("DIRECT_URL")
  }
});
