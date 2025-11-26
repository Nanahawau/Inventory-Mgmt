import { Injectable } from '@nestjs/common';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';

@Injectable()
export class SkuService {
  create(createSkuDto: CreateSkuDto) {
    return 'This action adds a new sku';
  }

  findAll() {
    return `This action returns all sku`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sku`;
  }

  update(id: number, updateSkuDto: UpdateSkuDto) {
    return `This action updates a #${id} sku`;
  }

  remove(id: number) {
    return `This action removes a #${id} sku`;
  }
}
