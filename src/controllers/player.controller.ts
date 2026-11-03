import type { Request, Response } from "express";
import { getPrisma } from "../db/prisma.js";
import { HttpError } from "../utils/http-error.js";

// ---------- Helpers ----------
function parseId(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function cleanNickname(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function findPlayerOr404(rawId: unknown) {
  const id = parseId(rawId);
  if (id === null) throw new HttpError(404, "Player tidak ditemukan");

  const prisma = await getPrisma();
  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) throw new HttpError(404, "Player tidak ditemukan");
  return player;
}

// ---------- POST /api/players ----------
export async function createPlayer(req: Request, res: Response): Promise<void> {
  const nickname = cleanNickname(req.body?.nickname);
  if (!nickname) throw new HttpError(400, "nickname wajib diisi");

  const prisma = await getPrisma();
  const existing = await prisma.player.findUnique({ where: { nickname } });
  if (existing) throw new HttpError(409, "nickname sudah dipakai");

  const player = await prisma.player.create({ data: { nickname } });

  res.status(201).json({
    status: true,
    message: "Player berhasil dibuat",
    data: player
  });
}

// ---------- GET /api/players/:player_id ----------
export async function getPlayerById(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.player_id);
  if (id === null) throw new HttpError(404, "Player tidak ditemukan");

  const prisma = await getPrisma();
  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      playerHeroes: {
        include: { hero: { select: { id: true, name: true } } },
        orderBy: { id: "asc" }
      }
    }
  });
  if (!player) throw new HttpError(404, "Player tidak ditemukan");

  res.status(200).json({
    status: true,
    message: "Berhasil mengambil data player",
    data: {
      id: player.id,
      nickname: player.nickname,
      bp: player.bp,
      diamond: player.diamond,
      createdAt: player.createdAt,
      heroes: player.playerHeroes.map((ph) => ({
        heroId: ph.hero.id,
        name: ph.hero.name,
        currency: ph.currency,
        pricePaid: ph.pricePaid
      }))
    }
  });
}

// ---------- PATCH /api/players/:player_id ----------
export async function updatePlayer(req: Request, res: Response): Promise<void> {
  // 1. player harus ada -> 404
  const player = await findPlayerOr404(req.params.player_id);

  // 2. nickname tidak boleh kosong -> 400
  const nickname = cleanNickname(req.body?.nickname);
  if (!nickname) throw new HttpError(400, "nickname wajib diisi");

  // 3. nickname tidak boleh dipakai player lain -> 409
  const prisma = await getPrisma();
  const taken = await prisma.player.findFirst({
    where: { nickname, id: { not: player.id } }
  });
  if (taken) throw new HttpError(409, "nickname sudah dipakai player lain");

  const updated = await prisma.player.update({
    where: { id: player.id },
    data: { nickname }
  });

  res.status(200).json({
    status: true,
    message: "Player berhasil diperbarui",
    data: updated
  });
}

// ---------- DELETE /api/players/:player_id ----------
export async function deletePlayer(req: Request, res: Response): Promise<void> {
  const player = await findPlayerOr404(req.params.player_id);

  // PlayerHero ikut terhapus karena onDelete: Cascade di schema
  const prisma = await getPrisma();
  await prisma.player.delete({ where: { id: player.id } });

  res.status(200).json({
    status: true,
    message: "Player berhasil dihapus",
    data: { id: player.id, nickname: player.nickname }
  });
}

// ---------- POST /api/players/:player_id/topup ----------
export async function topUpDiamond(req: Request, res: Response): Promise<void> {
  const amount: unknown = req.body?.amount;

  // 1. amount harus bilangan bulat > 0 -> 400
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    throw new HttpError(400, "amount harus bilangan bulat lebih dari 0");
  }

  // 2. player harus ada -> 404
  const player = await findPlayerOr404(req.params.player_id);

  // 3. berhasil
  const prisma = await getPrisma();
  const updated = await prisma.player.update({
    where: { id: player.id },
    data: { diamond: { increment: amount } },
    select: { id: true, diamond: true }
  });

  res.status(200).json({
    status: true,
    message: "Top up berhasil",
    data: {
      playerId: updated.id,
      amount,
      diamond: updated.diamond
    }
  });
}

// ---------- POST /api/players/:player_id/matches ----------
const MATCH_REWARD = { WIN: 300, LOSE: 100 } as const;

export async function playMatch(req: Request, res: Response): Promise<void> {
  const result: unknown = req.body?.result;

  // 1. result harus WIN / LOSE -> 400
  if (result !== "WIN" && result !== "LOSE") {
    throw new HttpError(400, "result harus WIN atau LOSE");
  }

  // 2. player harus ada -> 404
  const player = await findPlayerOr404(req.params.player_id);

  // 3. berhasil
  const bpEarned = MATCH_REWARD[result];
  const prisma = await getPrisma();
  const updated = await prisma.player.update({
    where: { id: player.id },
    data: { bp: { increment: bpEarned } },
    select: { id: true, bp: true }
  });

  res.status(200).json({
    status: true,
    message: "Hadiah match berhasil ditambahkan",
    data: {
      playerId: updated.id,
      result,
      bpEarned,
      bp: updated.bp
    }
  });
}