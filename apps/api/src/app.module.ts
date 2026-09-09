import { Module } from "@nestjs/common";
import { AuthController } from "./auth/auth.controller";
import { HealthController } from "./health/health.controller";
import { InventoryController } from "./inventory/inventory.controller";
import { OrdersController } from "./orders/orders.controller";
import { AdminSkusController } from "./products/admin-skus.controller";
import { AdminProductsController } from "./products/admin-products.controller";
import { ProductsController } from "./products/products.controller";

@Module({
  controllers: [
    HealthController,
    AuthController,
    ProductsController,
    AdminProductsController,
    OrdersController,
    AdminSkusController,
    InventoryController,
  ],
})
export class AppModule {}
