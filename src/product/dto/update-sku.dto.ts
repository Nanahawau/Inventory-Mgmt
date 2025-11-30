import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateSkuDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  skuCode: string;

  @IsOptional()
  attributes?: Record<string, string>;
}