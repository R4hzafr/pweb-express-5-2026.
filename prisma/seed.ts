import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { Currency, Lane, Rarity, Role } from "../src/generated/prisma/enums.js";

interface HeroDatasetRow {
  name: string;
  primaryRole: string;
  primaryLane: string;
  releaseYear: number | string;
  priceBP: number | string | null;
  priceDiamond: number | string | null;
}

interface SkinDatasetRow {
  name: string;
  heroId: number | string;
  rarity: string;
  priceDiamond: number | string;
}

function readArray<T>(raw: unknown, fileName: string): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && "data" in raw && Array.isArray((raw as { data: unknown }).data)) {
    return (raw as { data: T[] }).data;
  }
  throw new Error(`${fileName} harus berisi JSON array atau object dengan properti data berupa array.`);
}

function nullableNumber(value: number | string | null): number | null {
  if (value === null || value === "") return null;
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue)) throw new Error(`Nilai harga tidak valid: ${value}`);
  return numberValue;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur. Isi file .env terlebih dahulu.");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const heroesPath = path.resolve("data/heroes.json");
  const skinsPath = path.resolve("data/skins.json");

  const [heroesRaw, skinsRaw] = await Promise.all([
    fs.readFile(heroesPath, "utf8"),
    fs.readFile(skinsPath, "utf8")
  ]);

  const heroes = readArray<HeroDatasetRow>(JSON.parse(heroesRaw), "heroes.json");
  const skins = readArray<SkinDatasetRow>(JSON.parse(skinsRaw), "skins.json");

  if (heroes.length !== 133) {
    throw new Error(`Dataset hero seharusnya 133 data, tetapi ditemukan ${heroes.length}.`);
  }
  if (skins.length !== 892) {
    throw new Error(`Dataset skin seharusnya 892 data, tetapi ditemukan ${skins.length}.`);
  }

  console.log("Mengosongkan tabel lama...");
  await prisma.$executeRawUnsafe('TRUNCATE "PlayerHero", "Player", "Skin", "Hero" RESTART IDENTITY CASCADE');

  console.log("Memasukkan 133 hero...");
  await prisma.hero.createMany({
    data: heroes.map((hero) => ({
      name: hero.name,
      role: hero.primaryRole.trim().toUpperCase() as Role,
      lane: hero.primaryLane.trim().toUpperCase() as Lane,
      releaseYear: Number(hero.releaseYear),
      priceBP: nullableNumber(hero.priceBP),
      priceDiamond: nullableNumber(hero.priceDiamond)
    }))
  });

  console.log("Memasukkan 892 skin...");
  await prisma.skin.createMany({
    data: skins.map((skin) => ({
      name: skin.name,
      heroId: Number(skin.heroId),
      rarity: skin.rarity.trim().toUpperCase() as Rarity,
      priceDiamond: Number(skin.priceDiamond)
    }))
  });

  console.log("Memasukkan 3 player...");
  await prisma.player.createMany({
    data: [
      { nickname: "ArekITS", bp: 1500, diamond: 75 },
      { nickname: "SangPushRank", bp: 13000, diamond: 2892 },
      { nickname: "MageSurabaya", bp: 10000, diamond: 0 }
    ]
  });

  console.log("Memasukkan data kepemilikan hero awal...");
  await prisma.playerHero.createMany({
    data: [
      { playerId: 1, heroId: 18, currency: Currency.BP, pricePaid: 2000 },
      { playerId: 1, heroId: 1, currency: Currency.BP, pricePaid: 10800 },
      { playerId: 2, heroId: 84, currency: Currency.DIAMOND, pricePaid: 599 },
      { playerId: 2, heroId: 56, currency: Currency.BP, pricePaid: 32000 }
    ]
  });

  console.log("Seed selesai. Periksa Prisma Studio: 133 Hero, 892 Skin, 3 Player, 4 PlayerHero.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
