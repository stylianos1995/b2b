import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

// Use require so express.raw/json are available at runtime (default import can be undefined after build).
const express = require("express") as typeof import("express");

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Stripe webhook must receive raw body for signature verification; all other routes use JSON.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl === "/v1/payments/webhook" && req.method === "POST") {
      express.raw({ type: "application/json" })(req, res, next);
    } else {
      express.json()(req, res, next);
    }
  });

  app.enableCors({
    origin: true, // allow any origin (e.g. file:// or localhost) for local testing
    credentials: true,
  });

  app.setGlobalPrefix("v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  return port;
}

bootstrap().then((port) => {
  console.log(`Application is running on: http://localhost:${port}/v1`);
});
