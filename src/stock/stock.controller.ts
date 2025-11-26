import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus, HttpCode, ValidationPipe, UsePipes } from '@nestjs/common';
import { StockService } from './stock.service';
import { AdjustSkuStockDto } from './dto/adjust-sku-stock.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';

@Controller('stock')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class StockController {
  constructor(private readonly stockService: StockService) { }

  @Post('reservations')
  async createReservation(@Body() body: CreateReservationDto) {
    // returns the created reservation and updated skuStock
    return this.stockService.reserve(body);
  }

  @Post("reservations/:id/fulfill")
  @HttpCode(HttpStatus.OK)
  async fulfillReservation(@Param("id") id: string) {
    return this.stockService.fulfillReservation(id);
  }

  @Post("reservations/:id/release")
  @HttpCode(HttpStatus.OK)
  async releaseReservation(@Param("id") id: string) {
    return this.stockService.releaseReservation(id);
  }

  @Get('reservations')
  async listReservation(@Query("inventoryItemId") inventoryItemId?: string, @Query("skuId") skuId?: string, @Query("status") status?: string) {
    // StockService.findReservations should accept filters; adapt if your service API differs
    return this.stockService.findReservations({ inventoryItemId, skuId, status });
  }

  @Post('transfers')
  async createTransfer(@Body() body: CreateTransferDto) {
    // returns transfer header + movements + updated sku stocks
    return this.stockService.createTransfer(body);
  }

  @Get('transfers')
  async listTransfer(@Query("inventoryItemId") inventoryItemId?: string) {
    return this.stockService.findTransfers({ inventoryItemId });
  }

  @Post("sku-stock/:id/adjust")
  async adjustSkuStock(@Param("id") id: string, @Body() body: AdjustSkuStockDto) {
    return this.stockService.adjustSkuStock(id, body.delta, body.type, body.reference);
  }

  @Get("sku-stock/:id")
  async getSkuStock(@Param("id") id: string) {
    return this.stockService.getSkuStock(id);
  }

  @Post('inventory')
  async createInventory(@Body() body: CreateInventoryDto) {
    return this.stockService.createInventory(body);
  }

  @Get('inventory')
  async listInventory(@Query("storeId") storeId?: string, @Query("productId") productId?: string, @Query("page") page = "1", @Query("pageSize") pageSize = "20") {
    // transform to numbers and pass to service
    return this.stockService.findInventory({
      storeId,
      productId,
      page: Number(page),
      pageSize: Number(pageSize)
    });
  }
}
