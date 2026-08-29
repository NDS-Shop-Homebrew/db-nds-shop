import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";

export async function trackDownload(req: Request, _res: Response, next: NextFunction) {
  if (req.method === "HEAD") {
    return next();
  }

  const { file } = req.params;
  const userAgent = ((req.headers["user-agent"] as string) || "unknown").slice(0, 180);
  const ip = (req.ip || req.socket?.remoteAddress || "unknown").slice(0, 45);

  try {
    if (file) {
      await prisma.downloadLog.create({
        data: {
          game: decodeURIComponent(file).slice(0, 191),
          title: (req.query.title as string)?.slice(0, 191) || undefined,
          userAgent,
          ip,
        },
      });
    }
  } catch (error) {
    console.error("[trackDownload] Failed to log download:", error);
  }

  next();
}