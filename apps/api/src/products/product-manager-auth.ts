import { HttpException, HttpStatus } from "@nestjs/common";
import type { Request } from "express";
import type { UserRole } from "@commerceops/types";

export function requireProductManager(req: Request): Express.AuthContext {
  const auth = req.authContext;

  if (!auth) {
    throw new HttpException(
      { code: "unauthorized", message: "Sign in to continue" },
      HttpStatus.UNAUTHORIZED,
    );
  }

  const allowed: UserRole[] = ["admin", "inventory_manager"];
  if (!allowed.includes(auth.role)) {
    throw new HttpException(
      { code: "forbidden", message: "You are not authorized to manage products" },
      HttpStatus.FORBIDDEN,
    );
  }

  return auth;
}
