import { IsUUID, IsInt, Min, IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";

/**
 * CreateReservationDto
 * - inventoryItemId: the inventory item to reserve from (central inventory id)
 * - skuId: SKU to reserve
 * - quantity: number to reserve (integer > 0)
 * - ttlSeconds: optional TTL in seconds (default handled by service)
 * - reference: optional external reference (order id, etc.)
 */
export class CreateReservationDto {
  @IsInt()
  inventoryItemId!: number;

  @IsUUID()
  skuId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ttlSeconds?: number;

  @IsOptional()
  @IsString()
  reference?: string;
}