import { Module } from "@nestjs/common";
import { DevAuthController } from "./dev-auth/dev-auth.controller";
import { HealthController } from "./health/health.controller";
import { InventoryController } from "./inventory/inventory.controller";

@Module({
  controllers: [HealthController, DevAuthController, InventoryController],
})
export class AppModule {}
