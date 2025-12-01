import { IsString, IsOptional, IsNumber, ValidateNested, IsArray } from "class-validator";
import { Type } from "class-transformer";
import { CreateSkuDto } from "./create-sku.dto";

/**
 * CreateProductDto
 * - name, category, price, description
 * - skus: array of SKUs to create with the product
 * - centralStoreId: optional store id for the central pool to receive initial stock (if any sku.initialCentralStock provided)
 */
export class CreateProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSkuDto)
  skus?: CreateSkuDto[];

  @IsOptional()
  // integer id of the central store where initial stock should be placed
  @Type(() => Number)
  @IsNumber()
  centralStoreId?: number;
}