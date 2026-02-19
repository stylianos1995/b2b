import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { configModuleOptions } from "./app.config";

@Global()
@Module({
  imports: [ConfigModule.forRoot(configModuleOptions)],
})
export class AppConfigModule {}
