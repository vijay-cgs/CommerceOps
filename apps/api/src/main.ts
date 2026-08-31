import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionEnvelopeFilter } from "./common/filters/http-exception.filter";
import { devAuthMiddleware } from "./common/middleware/dev-auth.middleware";
import { ResponseEnvelopeInterceptor } from "./common/interceptors/response-envelope.interceptor";
import { correlationIdMiddleware } from "./common/middleware/correlation-id.middleware";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1");
  app.use(correlationIdMiddleware);
  app.use(devAuthMiddleware);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(new HttpExceptionEnvelopeFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("CommerceOps API")
    .setDescription("CommerceOps REST API baseline")
    .setVersion("1.0.0")
    .addServer("/api/v1")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(3002);
}

void bootstrap();
