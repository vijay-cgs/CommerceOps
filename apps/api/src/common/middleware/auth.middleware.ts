import type { Request, Response, NextFunction } from "express";
import { verifySessionToken } from "../../auth/jwt";

function readBearerToken(req: Request): string | null {
  const header = req.header("authorization");

  if (!header?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim() || null;
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = readBearerToken(req);

  if (token) {
    const claims = await verifySessionToken(token);

    if (claims) {
      req.authContext = {
        userId: claims.sub,
        role: claims.role,
        email: claims.email,
        name: claims.name,
      };
    }
  }

  next();
}
