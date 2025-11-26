import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SkuService } from './sku.service';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';

@Controller('sku')
export class SkuController {
  constructor(private readonly skuService: SkuService) {}

  @Post()
  create(@Body() createSkuDto: CreateSkuDto) {
    return this.skuService.create(createSkuDto);
  }

  @Get()
  findAll() {
    return this.skuService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skuService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSkuDto: UpdateSkuDto) {
    return this.skuService.update(+id, updateSkuDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skuService.remove(+id);
  }
}
