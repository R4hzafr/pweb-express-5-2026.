import { Router } from "express";
import { getAllSkins, getSkinById } from "../controllers/skin.controller.js";

const router = Router();
router.get("/", getAllSkins);
router.get("/:skin_id", getSkinById);
export default router;
