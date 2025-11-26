import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { Stock } from './entities/stock.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from 'src/stock/entities/inventoryitems.entity';
import { SkuStock } from './entities/skustock.entity';
import { Reservation } from './entities/reservation.entity';
import { StockMovement } from './entities/stockmovement.entity';
import { Transfer } from './entities/transfer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, SkuStock, Reservation, StockMovement, Transfer])],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule { }