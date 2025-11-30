import { Controller, Get, Param, Query } from '@nestjs/common';
import { SkuService } from './sku.service';

@Controller('sku')
export class SkuController {
  constructor(private readonly skuService: SkuService) {}

  @Get('')
  findAll(@Query('productId') productId?: string, @Query('page') page = '1', @Query('pageSize') pageSize = '20', @Query('search') search = '') {
    // When productId provided, route to filtered list
    if (productId) {
      return this.skuService.findByProduct({
        productId: Number(productId),
        page: Number(page),
        pageSize: Number(pageSize),
        search,
      });
    }
    return this.skuService.findAll({ page: Number(page), pageSize: Number(pageSize), search });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skuService.findOne(+id);
  }
}