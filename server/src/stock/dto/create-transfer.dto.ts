import { IsInt, Min, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

/**
 * CreateTransferDto
 * - reservationId: the reservation to consume (preferred)
 * - toInventoryItemId: destination inventory item (store inventory id)
 * - quantity: how much to transfer (must be <= reservation.quantity if reservationId provided)
 * - reference: optional reference for transfer grouping
 */
export class CreateTransferDto {
  @IsOptional()
  @IsInt()
  reservationId?: number;

  @IsInt()
  toInventoryItemId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  reference?: string;
}