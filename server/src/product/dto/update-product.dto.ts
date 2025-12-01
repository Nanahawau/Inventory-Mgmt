import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { UpdateSkuDto } from "./update-sku.dto";
import { Type } from "class-transformer";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSkuDto)
  @IsOptional()
  skus?: UpdateSkuDto[];
}