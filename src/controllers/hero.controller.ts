import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client.js";
import { getPrisma } from "../db/prisma.js";
import { HttpError } from "../utils/http-error.js";
import { getPagination } from "../utils/pagination.js";

const roles = ["TANK", "FIGHTER", "ASSASSIN", "MAGE", "MARKSMAN", "SUPPORT"] as const;
const lanes = ["EXP", "GOLD", "MID", "JUNGLE", "ROAM"] as const;
type RoleValue = (typeof roles)[number];
type LaneValue = (typeof lanes)[number];

function parseId(value: string | string[], label: string): number {
  const id = Number(Array.isArray(value) ? value[0] : value);
  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(400, `${label} harus berupa bilangan bulat positif`);
  }
  return id;
}

function optionalPrice(value: unknown, fieldName: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  const price = Number(value);
  if (!Number.isInteger(price) || price < 0) {
    throw new HttpError(400, `${fieldName} harus berupa bilangan bulat minimal 0 atau null`);
  }
  return price;
}

export async function getAllHeroes(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const roleValue = typeof req.query.role === "string" ? req.query.role.toUpperCase() : undefined;

  if (roleValue && !roles.includes(roleValue as RoleValue)) {
    throw new HttpError(400, `Role tidak valid. Pilihan: ${roles.join(", ")}`);
  }

  const where: Prisma.HeroWhereInput = {
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    ...(roleValue ? { role: roleValue as RoleValue } : {})
  };

  const prisma = await getPrisma();
  const [heroes, totalItems] = await Promise.all([
    prisma.hero.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: "asc" }
    }),
    prisma.hero.count({ where })
  ]);

  res.status(200).json({
    status: true,
    message: "Berhasil mengambil data hero",
    data: heroes,
    metadata: {
      currentPage: page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  });
}

export async function getHeroById(req: Request, res: Response): Promise<void> {
  const heroId = parseId(req.params.hero_id, "hero_id");

  const prisma = await getPrisma();
  const hero = await prisma.hero.findUnique({
    where: { id: heroId },
    include: { skins: true }
  });

  if (!hero) throw new HttpError(404, "Hero tidak ditemukan");

  res.status(200).json({
    status: true,
    message: "Berhasil mengambil detail hero",
    data: hero
  });
}

export async function createHero(req: Request, res: Response): Promise<void> {
  const { name, role, lane, releaseYear, priceBP, priceDiamond } = req.body ?? {};

  // Validasi wajib mengikuti urutan requirement pada modul.
  if (
    typeof name !== "string" || !name.trim() ||
    typeof role !== "string" || !role.trim() ||
    typeof lane !== "string" || !lane.trim() ||
    releaseYear === undefined || releaseYear === null || releaseYear === ""
  ) {
    throw new HttpError(400, "name, role, lane, dan releaseYear wajib diisi");
  }

  const normalizedRole = role.toUpperCase();
  const normalizedLane = lane.toUpperCase();
  const year = Number(releaseYear);

  const normalizedName = name.trim();
  const prisma = await getPrisma();
  const existingHero = await prisma.hero.findUnique({ where: { name: normalizedName } });
  if (existingHero) throw new HttpError(409, "Nama hero sudah digunakan");

  if (!roles.includes(normalizedRole as RoleValue)) {
    throw new HttpError(400, `Role tidak valid. Pilihan: ${roles.join(", ")}`);
  }
  if (!lanes.includes(normalizedLane as LaneValue)) {
    throw new HttpError(400, `Lane tidak valid. Pilihan: ${lanes.join(", ")}`);
  }
  if (!Number.isInteger(year) || year < 1) {
    throw new HttpError(400, "releaseYear harus berupa bilangan bulat positif");
  }

  try {
    const hero = await prisma.hero.create({
      data: {
        name: normalizedName,
        role: normalizedRole as RoleValue,
        lane: normalizedLane as LaneValue,
        releaseYear: year,
        priceBP: optionalPrice(priceBP, "priceBP"),
        priceDiamond: optionalPrice(priceDiamond, "priceDiamond")
      }
    });

    res.status(201).json({
      status: true,
      message: "Hero berhasil ditambahkan",
      data: hero
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw new HttpError(409, "Nama hero sudah digunakan");
    }
    throw error;
  }

  //router.post('/api/players/:player_id/heroes', buyHeroController);
}
