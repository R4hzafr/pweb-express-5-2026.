import type { ErrorRequestHandler } from "express";
import { HttpError } from "../utils/http-error.js";

function hasPrismaCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      status: false,
      message: error.message
    });
    return;
  }

  if (hasPrismaCode(error, "P2002")) {
    res.status(409).json({ status: false, message: "Data sudah digunakan" });
    return;
  }

  if (hasPrismaCode(error, "P2025")) {
    res.status(404).json({ status: false, message: "Data tidak ditemukan" });
    return;
  }

  if (hasPrismaCode(error, "P2003")) {
    res.status(400).json({ status: false, message: "Relasi data tidak valid" });
    return;
  }

  console.error("Unhandled error:", error);
  res.status(500).json({
    status: false,
    message: "Terjadi kesalahan pada server"
  });
};
