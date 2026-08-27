import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";

export async function trackDownload(req: Request, _res: Response, next: NextFunction) {
  if (req.method === "HEAD") {
    return next();
  }

  const { file } = req.params;
  const userAgent = (req.headers["user-agent"] as string) || "unknown";
  const ip = req.ip || req.socket?.remoteAddress || "unknown";

  try {
    if (file) {
      await prisma.downloadLog.create({
        data: {
          game: decodeURIComponent(file),
          title: (req.query.title as string) || undefined,
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