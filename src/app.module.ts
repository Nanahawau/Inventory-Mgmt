import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StoreModule } from './store/store.module';
import { ProductModule } from './product/product.module';
import { Store } from './store/entities/store.entity';
import { Product } from './product/entities/product.entity';
import { ConfigModule, ConfigType } from '@nestjs/config';
import databaseConfig from './config/database.config';
import defaultConfig from './config/default.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkuModule } from './sku/sku.module';
import { StockModule } from './stock/stock.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { Sku } from './sku/entities/sku.entity';
import { Stock } from './stock/entities/stock.entity';
import { User } from './user/entities/user.entity';
import jwtConfig from './config/jwt.config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { InventoryItem } from './stock/entities/inventoryitems.entity';
import { SkuStock } from './stock/entities/skustock.entity';
import { Reservation } from './stock/entities/reservation.entity';
import { Transfer } from './stock/entities/transfer.entity';
import { StockMovement } from './stock/entities/stockmovement.entity';
import { JwtAuthGuard } from './auth/guard/jwt.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [ConfigModule.forRoot({
    load: [databaseConfig, defaultConfig, jwtConfig],
    isGlobal: true,
  }),
  JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [jwtConfig.KEY],
    useFactory: (cfg: ConfigType<typeof jwtConfig>) => ({
      secret: cfg.secret,
      signOptions: { expiresIn: cfg.jwtExpiry as any},
    }),
  }),
  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [databaseConfig.KEY],
    useFactory: async (dbConfig: ConfigType<typeof databaseConfig>) => ({
      type: dbConfig.type,
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      entities: [Store, Product, InventoryItem, Sku, Stock, User, SkuStock, Reservation, Transfer, StockMovement],
      synchronize: dbConfig.synchronize,
    }),
  }), StoreModule, ProductModule, SkuModule, StockModule, AuthModule, UserModule],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },],
})
export class AppModule { }
