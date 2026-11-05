import { Router } from "express";
import { buyHero, getStatistics } from "../controllers/purchase.controller.js";

const router = Router();

// Daftarkan route untuk Orang ke-3:
router.post("/api/players/:player_id/heroes", buyHero);
router.get("/api/statistics", getStatistics);

export default router;