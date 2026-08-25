import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

/**
 * Middleware to track ROM downloads in the database.
 * Creates a DownloadLog entry for each download request.
 */
export = async function trackDownload(req: Request, res: Response, next: NextFunction) {
  const { game } = req.params;
  const userAgent = req.headers['user-agent'] || 'unknown';
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';

  try {
    await prisma.downloadLog.create({
      data: {
        game,
        title: (req.query.title as string) || undefined,
        userAgent,
        ip,
      },
    });
  } catch (error) {
    console.error('[trackDownload] Failed to log download:', error);
  }

  next();
};
