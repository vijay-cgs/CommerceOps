import { Module } from "@nestjs/common";
import { AuthController } from "./auth/auth.controller";
import { HealthController } from "./health/health.controller";
import { InventoryController } from "./inventory/inventory.controller";

@Module({
  controllers: [HealthController, AuthController, InventoryController],
})
export class AppModule {}
