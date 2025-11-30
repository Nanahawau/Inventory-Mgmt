import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { Stock } from './entities/stock.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from 'src/stock/entities/inventoryitems.entity';
import { SkuStock } from './entities/skustock.entity';
import { Reservation } from './entities/reservation.entity';
import { StockMovement } from './entities/stockmovement.entity';
import { Product } from 'src/product/entities/product.entity';
import { Store } from 'src/store/entities/store.entity';
import { Sku } from 'src/sku/entities/sku.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Stock, Store, Product, InventoryItem, SkuStock, Reservation, StockMovement, Sku])],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule { }