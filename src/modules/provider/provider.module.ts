import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Provider } from '../../entities/provider.entity';
import { Location } from '../../entities/location.entity';
import { Product } from '../../entities/product.entity';
import { ProviderUser } from '../../entities/provider-user.entity';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';
import { ProducersModule } from '../../producers/producers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider, Location, Product, ProviderUser]),
    ProducersModule,
  ],
  controllers: [ProviderController],
  providers: [ProviderService],
  exports: [ProviderService],
})
export class ProviderModule {}
