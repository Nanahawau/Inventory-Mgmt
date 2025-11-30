import { IsInt, IsOptional, IsString } from "class-validator";

export class TransferStockDto {

    @IsInt()
    centralInventoryItemId: number;
    @IsInt()
    toStoreId: number;
    @IsInt()
    productId: number;
    @IsInt()
    skuId: number;
    @IsInt()
    quantity: number;
    @IsOptional()
    @IsString()
    reference?: string;
}