import { Controller, Get, Req } from "@nestjs/common";
import type { Request } from "express";
import { DEV_SEED_USERS } from "./dev-seed-users";

@Controller("dev-auth")
export class DevAuthController {
  @Get("users")
  getUsers() {
    return {
      users: DEV_SEED_USERS,
    };
  }

  @Get("me")
  getCurrentUser(@Req() req: Request) {
    return {
      user: req.authContext ?? null,
    };
  }
}
