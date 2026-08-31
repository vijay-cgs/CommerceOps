import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { LoginDto, RegisterDto } from "./auth.dto";
import {
  assessPasswordStrength,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  loginUser,
  registerUser,
} from "./auth.service";

@Controller("auth")
export class AuthController {
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterDto) {
    const weakness = assessPasswordStrength(body.password);

    if (weakness) {
      throw new HttpException({ code: "weak_password", message: weakness }, HttpStatus.BAD_REQUEST);
    }

    try {
      return await registerUser(body);
    } catch (error) {
      if (error instanceof EmailAlreadyRegisteredError) {
        throw new HttpException(
          { code: "email_taken", message: "That email is already registered" },
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    try {
      return await loginUser(body);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new HttpException(
          { code: "invalid_credentials", message: "Invalid email or password" },
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw error;
    }
  }

  @Get("me")
  me(@Req() req: Request) {
    if (!req.authContext) {
      throw new HttpException(
        { code: "unauthorized", message: "Authentication required" },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return { user: req.authContext };
  }
}
