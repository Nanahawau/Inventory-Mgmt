import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Sku } from './entities/sku.entity';

type ListQuery = { page: number; pageSize: number; search?: string };
type ByProductQuery = ListQuery & { productId: number };

@Injectable()
export class SkuService {
  constructor(
    @InjectRepository(Sku)
    private readonly skuRepo: Repository<Sku>,
  ) {}

  async findAll(query: ListQuery) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, Math.min(200, query.pageSize || 20));
    const skip = (page - 1) * pageSize;
    const where = query.search ? { skuCode: Like(`%${query.search}%`) } : {};
    const [data, total] = await this.skuRepo.findAndCount({
      where,
      relations: ['product'],
      skip,
      take: pageSize,
      order: { id: 'DESC' },
    });
    return { data, meta: { page, pageSize, total } };
  }

  async findByProduct(query: ByProductQuery) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, Math.min(200, query.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = { product: { id: query.productId } };
    if (query.search) where.skuCode = Like(`%${query.search}%`);

    const [data, total] = await this.skuRepo.findAndCount({
      where,
      relations: ['product'],
      skip,
      take: pageSize,
      order: { id: 'DESC' },
    });

    return { data, meta: { page, pageSize, total } };
  }

  findOne(id: number) {
    return this.skuRepo.findOne({ where: { id }, relations: ['product'] });
  }
}