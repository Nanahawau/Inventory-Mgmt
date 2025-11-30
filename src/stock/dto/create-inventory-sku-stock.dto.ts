import { IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

/**
 * helper DTO for initial SKU stocks when creating an inventory item
 */
export class CreateInventorySkuStockDto {
  @IsInt()
  skuId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;
}