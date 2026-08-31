import type { Request, Response, NextFunction } from "express";
import {
  DEFAULT_DEV_USER_ID,
  findDevSeedUserById,
} from "../../dev-auth/dev-seed-users";

const DEV_USER_ID_HEADER = "x-dev-user-id";

export function devAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const requestedUserId = req.header(DEV_USER_ID_HEADER) ?? DEFAULT_DEV_USER_ID;
  const seedUser = findDevSeedUserById(requestedUserId);

  if (seedUser) {
    req.authContext = {
      userId: seedUser.id,
      role: seedUser.role,
      email: seedUser.email,
      name: seedUser.name,
    };
  }

  next();
}
