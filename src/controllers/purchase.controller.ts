import type { Request, Response } from "express";
import { getPrisma } from "../db/prisma.js";
import { HttpError } from "../utils/http-error.js";

function parseId(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// ---------- POST /api/players/:player_id/heroes ----------
export async function buyHero(req: Request, res: Response): Promise<void> {
  const playerId = parseId(req.params.player_id);
  if (playerId === null) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const { heroId: heroIdInput, currency } = req.body ?? {};

  // 1. Validasi heroId kosong / tidak valid, atau currency bukan BP / DIAMOND -> 400
  const heroId = parseId(heroIdInput);
  if (heroId === null || (currency !== "BP" && currency !== "DIAMOND")) {
    throw new HttpError(400, "heroId wajib diisi dengan valid dan currency harus BP atau DIAMOND");
  }

  const prisma = await getPrisma();

  // 2. Cek apakah player ada -> 404
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  // 3. Cek apakah hero ada -> 404
  const hero = await prisma.hero.findUnique({ where: { id: heroId } });
  if (!hero) {
    throw new HttpError(404, "Hero tidak ditemukan");
  }

  // 4. Cek apakah harga hero untuk currency tersebut kosong -> 400
  const price = currency === "BP" ? hero.priceBP : hero.priceDiamond;
  if (price === null || price === undefined) {
    throw new HttpError(400, `Hero ini tidak memiliki harga untuk mata uang ${currency}`);
  }

  // 5. Cek apakah player sudah memiliki hero tersebut -> 409
  const existingOwnership = await prisma.playerHero.findUnique({
    where: {
      playerId_heroId: {
        playerId: playerId,
        heroId: heroId
      }
    }
  });
  if (existingOwnership) {
    throw new HttpError(409, "Player sudah memiliki hero tersebut");
  }

  // 6. Cek apakah saldo player kurang dari harga hero -> 400
  const currentBalance = currency === "BP" ? player.bp : player.diamond;
  if (currentBalance < price) {
    throw new HttpError(400, `Saldo ${currency} tidak mencukupi`);
  }

  // Simpan dengan transaksi Prisma (decrement saldo & buat PlayerHero)
  const [updatedPlayer, playerHero] = await prisma.$transaction([
    prisma.player.update({
      where: { id: playerId },
      data: currency === "BP"
        ? { bp: { decrement: price } }
        : { diamond: { decrement: price } }
    }),
    prisma.playerHero.create({
      data: {
        playerId: playerId,
        heroId: heroId,
        currency: currency,
        pricePaid: price
      }
    })
  ]);

  res.status(201).json({
    status: true,
    message: "Hero berhasil dibeli",
    data: {
      hero,
      currency,
      pricePaid: price,
      remainingBalance: {
        bp: updatedPlayer.bp,
        diamond: updatedPlayer.diamond
      }
    }
  });
}

// ---------- GET /api/statistics ----------
export async function getStatistics(_req: Request, res: Response): Promise<void> {
  const prisma = await getPrisma();

  const [totalPlayers, totalHeroesOwned, diamondAggregate, mostOwnedGroups, heroesPerRole] =
    await Promise.all([
      prisma.player.count(),
      prisma.playerHero.count(),
      prisma.player.aggregate({ _sum: { diamond: true } }),
      prisma.playerHero.groupBy({
        by: ["heroId"],
        _count: { heroId: true },
        orderBy: { _count: { heroId: "desc" } },
        take: 1
      }),
      prisma.hero.groupBy({
        by: ["role"],
        _count: { role: true },
        orderBy: { _count: { role: "desc" } }
      })
    ]);

  const mostOwned = mostOwnedGroups[0];
  const mostOwnedHero = mostOwned
    ? await prisma.hero.findUnique({
        where: { id: mostOwned.heroId },
        select: { id: true, name: true }
      })
    : null;

  res.status(200).json({
    status: true,
    message: "Berhasil mengambil statistik",
    data: {
      totalPlayers,
      totalHeroesOwned,
      totalDiamond: diamondAggregate._sum.diamond ?? 0,
      mostOwnedHero: mostOwnedHero
        ? {
            heroId: mostOwnedHero.id,
            name: mostOwnedHero.name,
            owners: mostOwned?._count.heroId ?? 0
          }
        : null,
      heroesPerRole: heroesPerRole.map((group) => ({
        role: group.role,
        total: group._count.role
      }))
    }
  });
}