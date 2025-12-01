import { IsString, IsOptional, IsObject, IsInt, Min } from "class-validator";

/**
 * CreateSkuDto - used when creating a product with SKUs.
 * - skuCode: unique code for the variant (e.g. "TS-RED-S")
 * - attributes: optional JSON object for variant attributes (color, size)
 * - initialCentralStock: optional initial quantity to place in central inventory for this SKU
 */
export class CreateSkuDto {
  @IsString()
  skuCode!: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;

  @IsOptional()
  @IsInt()
  @Min(0)
  initialCentralStock?: number;
}