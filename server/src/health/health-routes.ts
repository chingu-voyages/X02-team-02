import { Router } from "express";
import { prisma } from "../db/prisma.js";

const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

healthRouter.get("/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch {
    return res.status(503).json({
      status: "error",
      database: "disconnected",
    });
  }
});

export default healthRouter;
