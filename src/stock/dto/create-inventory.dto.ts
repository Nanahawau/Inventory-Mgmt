import { IsInt, IsOptional, IsArray, ValidateNested, IsBoolean } from "class-validator";
import { Type } from "class-transformer";
import { CreateInventorySkuStockDto } from "./create-inventory-sku-stock.dto";

/**
 * CreateInventoryDto
 * - storeId: the store to which this inventory item belongs (use central store id for central pool)
 * - productId: product to create inventory for
 * - initialSkuStocks: optional initial sku stocks for the inventory item
 */
export class CreateInventoryDto {
  @IsInt()
  storeId!: number;

  @IsInt()
  productId!: number;

  @IsBoolean()
  isCentral?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInventorySkuStockDto)
  skuStocks?: CreateInventorySkuStockDto[];
}