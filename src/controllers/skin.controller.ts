import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client.js";
import { getPrisma } from "../db/prisma.js";
import { HttpError } from "../utils/http-error.js";
import { getPagination } from "../utils/pagination.js";

const rarities = ["COMMON", "EXCEPTIONAL", "DELUXE", "EXQUISITE", "GRAND", "SUPREME"] as const;
type RarityValue = (typeof rarities)[number];

function parseId(value: string, label: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(400, `${label} harus berupa bilangan bulat positif`);
  }
  return id;
}

export async function getAllSkins(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
  let heroId: number | undefined;
  let rarity: RarityValue | undefined;

  if (req.query.heroId !== undefined) {
    heroId = parseId(String(req.query.heroId), "heroId");
  }

  if (req.query.rarity !== undefined) {
    const rarityValue = String(req.query.rarity).toUpperCase();
    if (!rarities.includes(rarityValue as RarityValue)) {
      throw new HttpError(400, `Rarity tidak valid. Pilihan: ${rarities.join(", ")}`);
    }
    rarity = rarityValue as RarityValue;
  }

  const where: Prisma.SkinWhereInput = {
    ...(heroId !== undefined ? { heroId } : {}),
    ...(rarity ? { rarity } : {})
  };

  const prisma = await getPrisma();
  const [skins, totalItems] = await Promise.all([
    prisma.skin.findMany({
      where,
      include: { hero: true },
      skip,
      take: limit,
      orderBy: { id: "asc" }
    }),
    prisma.skin.count({ where })
  ]);

  res.status(200).json({
    status: true,
    message: "Berhasil mengambil data skin",
    data: skins,
    metadata: {
      currentPage: page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  });
}

export async function getSkinById(req: Request, res: Response): Promise<void> {
  const skinId = parseId(req.params.skin_id, "skin_id");

  const prisma = await getPrisma();
  const skin = await prisma.skin.findUnique({
    where: { id: skinId },
    include: { hero: true }
  });

  if (!skin) throw new HttpError(404, "Skin tidak ditemukan");

  res.status(200).json({
    status: true,
    message: "Berhasil mengambil detail skin",
    data: skin
  });
}
