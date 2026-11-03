import express from "express";
import healthRoutes from "./routes/health.routes.js";
import heroRoutes from "./routes/hero.routes.js";
import skinRoutes from "./routes/skin.routes.js";
import { logger } from "./middlewares/logger.js";
import { notFound } from "./middlewares/not-found.js";
import { errorHandler } from "./middlewares/error-handler.js";

const app = express();

app.use(express.json());
app.use(logger);

app.use(healthRoutes);
app.use("/api/heroes", heroRoutes);
app.use("/api/skins", skinRoutes);

// Route player, topup, matches, purchase, dan statistics ditambahkan anggota 2 dan 3.
app.use(notFound);
app.use(errorHandler);

export default app;
