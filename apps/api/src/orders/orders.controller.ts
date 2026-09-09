import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import type { OrderListResponse, OrderView } from "@commerceops/types";
import { PlaceOrderDto } from "./orders.dto";
import { getOrderForUser, listOrdersForUser, placeOrder } from "./orders.service";

function requireActor(req: Request): Express.AuthContext {
  if (!req.authContext) {
    throw new HttpException(
      { code: "unauthorized", message: "Sign in to continue" },
      HttpStatus.UNAUTHORIZED,
    );
  }

  return req.authContext;
}

@Controller("orders")
export class OrdersController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() body: PlaceOrderDto): Promise<OrderView> {
    const actor = requireActor(req);

    return placeOrder(body, { userId: actor.userId }, req.correlationId ?? "unknown");
  }

  @Get()
  async list(@Req() req: Request): Promise<OrderListResponse> {
    const actor = requireActor(req);

    return { orders: await listOrdersForUser(actor.userId) };
  }

  @Get(":orderNumber")
  async get(@Req() req: Request, @Param("orderNumber") orderNumber: string): Promise<OrderView> {
    const actor = requireActor(req);
    const order = await getOrderForUser(actor.userId, orderNumber);

    if (!order) {
      throw new HttpException(
        { code: "order_not_found", message: "Order not found" },
        HttpStatus.NOT_FOUND,
      );
    }

    return order;
  }
}
