import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './entities/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sku } from 'src/sku/entities/sku.entity';
import { StockService } from 'src/stock/stock.service';
import { StockModule } from 'src/stock/stock.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Sku]), StockModule],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
