import { IsInt, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

/**
 * AdjustSkuStockDto
 * - delta: signed integer to add/subtract from stock
 * - type: optional type for StockMovement (e.g., "adjust","receive","sale")
 * - reference: optional external reference (order id, transfer id)
 */
export class AdjustSkuStockDto {
  @Type(() => Number)
  @IsInt()
  delta!: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}