import { Injectable, BadRequestException, NotFoundException, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { CreateProductDto } from "./dto/create-product.dto";
import { CreateSkuDto } from "./dto/create-sku.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { StockService } from "../stock/stock.service";
import { Product } from "./entities/product.entity";
import { Sku } from "../sku/entities/sku.entity";
import { Like } from "typeorm";
import { ListProductsDto } from "./dto/list-product.dto";


@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Sku) private readonly skuRepo: Repository<Sku>,
    @Inject() private readonly stockService: StockService
  ) { }

  async createProduct(dto: CreateProductDto) {
    if (!dto.name) throw new BadRequestException("name is required");

    const product = this.productRepo.create({
      name: dto.name,
      category: dto.category ?? null,
      price:  dto.price,
      description: dto.description ?? null
    });
    await this.productRepo.save(product);

    const createdSkus: Sku[] = [];
    if (dto.skus && dto.skus.length > 0) {
      for (const s of dto.skus as CreateSkuDto[]) {
        const sku = this.skuRepo.create({
          skuCode: s.skuCode,
          attributes: s.attributes ?? null,
          product: { id: product.id } as any
        });
        await this.skuRepo.save(sku);
        createdSkus.push(sku);
      }
    }

    if (dto.centralStoreId && createdSkus.length > 0) {
      const initialSkuStocks = createdSkus
        .map((sku) => {
          const match = (dto.skus ?? []).find((x) => x.skuCode === sku.skuCode);
          const qty = match && typeof (match as any).initialCentralStock === "number" ? (match as any).initialCentralStock : 0;
          return { skuId: sku.id, initialStock: qty };
        })
        .filter((s) => s.initialStock > 0);

      if (initialSkuStocks.length > 0) {
        await this.stockService.createInventory({
          storeId: dto.centralStoreId,
          productId: product.id,
          initialSkuStocks
        } as any);
      }
    }

    const full = await this.productRepo.findOne({ where: { id: product.id }, relations: ["skus"] });
    if (!full) throw new NotFoundException("product creation failed");
    return full;
  }

  async findOne(id: number) {
    if (!id) throw new BadRequestException("id required");
    const product = await this.productRepo.findOne({ where: { id }, relations: ["skus"] });
    if (!product) throw new NotFoundException("product not found");
    return product;
  }

  async find(query?: ListProductsDto) {
    const page = Math.max(1, query?.page ?? 1);
    const pageSize = Math.max(1, Math.min(200, query?.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    // Build WHERE with optional search across name/category
    const term = query?.search?.trim();
    const where = term
      ? [{ name: Like(`%${term}%`) }, { category: Like(`%${term}%`) }]
      : {};

    const [items, total] = await this.productRepo.findAndCount({
      where,
      relations: ['skus'],
      skip,
      take: pageSize,
      order: { id: 'DESC' },
    });

    // Return array in data so client does not get null
    return {
      status: true,
      statusCode: 200,
      message: 'success',
      data: items,
      meta: { page, pageSize, total },
    };
  }

  async updateProduct(id: number, dto: UpdateProductDto) {
    if (!id) throw new BadRequestException('id required');

    const product = await this.productRepo.findOne({ where: { id }, relations: ['skus'] });
    if (!product) throw new NotFoundException('product not found');

    // Apply scalar field updates
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.category !== undefined) product.category = dto.category ?? null;
    if (dto.price !== undefined) product.price = typeof dto.price === 'number' ? dto.price : product.price;
    if (dto.description !== undefined) product.description = dto.description ?? null;

    return await this.productRepo.manager.transaction(async (trx) => {
      await trx.save(product);

      if (dto.skus) {
        const existing = product.skus ?? [];
        const existingById = new Map<number, Sku>();
        existing.forEach(s => existingById.set(s.id, s));

        const incomingWithId = dto.skus.filter(s => s.id);
        const incomingIds = new Set(incomingWithId.map(s => s.id!));

        // Delete SKUs not present anymore
        const toDelete = existing.filter(s => !incomingIds.has(s.id));
        if (toDelete.length) {
          await trx.delete(Sku, { id: In(toDelete.map(s => s.id)) });
        }

        for (const u of incomingWithId) {
          await trx.update(Sku, { id: u.id }, {
            skuCode: u.skuCode,
            attributes: (u.attributes ?? null) as Record<string, string> | null,
          });
        }

        // Create new SKUs (no id)
        const toCreate = dto.skus.filter(s => !s.id);
        for (const c of toCreate) {
          const newSku = trx.create(Sku, {
            product: { id: product.id } as any,
            skuCode: c.skuCode,
            attributes: c.attributes ?? null,
          });
          await trx.save(newSku);
        }
      }

      const full = await trx.findOne(Product, { where: { id: product.id }, relations: ['skus'] });
      if (!full) throw new NotFoundException('updated product not found');
      return full;
    });
  }

  async deleteProduct(id: number) {
    if (!id) throw new BadRequestException("id required");
    const product = await this.productRepo.findOne({ where: { id }, relations: ["skus"] });
    if (!product) throw new NotFoundException("product not found");

    await this.productRepo.manager.transaction(async (trx) => {
      if (product.skus && product.skus.length > 0) {
        await trx.delete(Sku, { id: In(product.skus.map((s) => s.id)) });
      }
      await trx.delete(Product, { id: product.id });
    });

    return { id, deleted: true };
  }
}