import type { Request, Response } from "express";

export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: true,
    message: "Server MLBB Shop berjalan",
    data: {
      service: "MLBB Shop API",
      timestamp: new Date().toISOString()
    }
  });
}
