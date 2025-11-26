import { Injectable, BadRequestException, NotFoundException, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateProductDto } from "./dto/create-product.dto";
import { CreateSkuDto } from "./dto/create-sku.dto";
import { StockService } from "../stock/stock.service";
import { Product } from "./entities/product.entity";
import { Sku } from "src/sku/entities/sku.entity";

/**
 * ProductService
 * - Creates Product and SKUs.
 * - If centralStoreId is provided and SKUs include initialCentralStock values,
 *   it will call StockService.createInventory to create the central InventoryItem + initial SkuStock rows.
 *
 * Note: StockService is injected; ensure modules are wired to avoid circular deps
 * (use forwardRef in module providers if necessary).
 */

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Sku) private readonly skuRepo: Repository<Sku>,
    @Inject() private readonly stockService: StockService
  ) {}

  // create product with skus; optionally seed central inventory
  async createProduct(dto: CreateProductDto) {
    if (!dto.name) throw new BadRequestException("name is required");

    // create product
    const product = this.productRepo.create({
      name: dto.name,
      category: dto.category ?? null,
      price: typeof dto.price === "number" ? dto.price : 0,
      description: dto.description ?? null
    });
    await this.productRepo.save(product);

    // create SKUs if any
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

    // If central store id is provided and at least one SKU has initialCentralStock,
    // create the central inventory and initial sku stocks via StockService.
    if (dto.centralStoreId && createdSkus.length > 0) {
      const initialSkuStocks = createdSkus
        .map((sku) => {
          // find matching CreateSkuDto by skuCode to get initialCentralStock
          const match = (dto.skus ?? []).find((x) => x.skuCode === sku.skuCode);
          const qty = match && typeof match.initialCentralStock === "number" ? match.initialCentralStock : 0;
          return { skuId: sku.id, initialStock: qty };
        })
        .filter((s) => s.initialStock > 0);

      if (initialSkuStocks.length > 0) {
        // delegate to StockService to create inventory (central) and seed stocks
        await this.stockService.createInventory({
          storeId: dto.centralStoreId,
          productId: product.id,
          initialSkuStocks
        } as any); // cast to CreateInventoryDto shape
      }
    }

    // return product with created skus (reload to include skus)
    const full = await this.productRepo.findOne({ where: { id: product.id }, relations: ["skus"] });
    if (!full) throw new NotFoundException("product creation failed");
    return full;
  }

  async findOne(id: number) {
    if (!id) throw new BadRequestException("id required");
    const p = await this.productRepo.findOne({ where: { id }, relations: ["skus"] });
    if (!p) throw new NotFoundException("product not found");
    return p;
  }

   async find() {
    return await this.productRepo.find();
  }
}