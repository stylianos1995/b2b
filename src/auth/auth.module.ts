import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { User } from "../entities/user.entity";
import { Session } from "../entities/session.entity";
import { BusinessUser } from "../entities/business-user.entity";
import { ProviderUser } from "../entities/provider-user.entity";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { ProducersModule } from "../producers/producers.module";
import { SeedModule } from "../seeds/seed.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session, BusinessUser, ProviderUser]),
    ProducersModule,
    SeedModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: config.get<string>("JWT_EXPIRES_IN", "15m"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
