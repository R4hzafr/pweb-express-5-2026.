import express from "express";
import healthRoutes from "./routes/health.routes.js";
import heroRoutes from "./routes/hero.routes.js";
import skinRoutes from "./routes/skin.routes.js";
import { logger } from "./middlewares/logger.js";
import { notFound } from "./middlewares/not-found.js";
import { errorHandler } from "./middlewares/error-handler.js";
import playerRoutes from "./routes/player.routes.js";
import apiRoutes from "./routes/api.route.js";

const app = express();

app.use(express.json());
app.use(logger);

app.use(healthRoutes);
app.use("/api/heroes", heroRoutes);
app.use("/api/skins", skinRoutes);
app.use("/api/players", playerRoutes);
app.use(apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
