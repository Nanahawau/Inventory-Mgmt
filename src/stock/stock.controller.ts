import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus, HttpCode, ValidationPipe, UsePipes } from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';

@Controller('stock')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class StockController {
  constructor(private readonly stockService: StockService) { }

  @Post('reservations')
  async createReservation(@Body() body: CreateReservationDto) {
    return this.stockService.reserve(body);
  }

  @Post("transfer")
  async transferStock(@Body() body: TransferStockDto) {
    return this.stockService.moveFromCentral(body);
  }

  @Get('reservations')
  async listReservation(
    @Query("inventoryItemId") inventoryItemId?: string,
    @Query("skuId") skuId?: string,
    @Query("status") status?: string,
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "20"
  ) {
    return this.stockService.findReservations({
      inventoryItemId,
      skuId,
      status,
      page: Number(page),
      pageSize: Number(pageSize),
    });
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

  @Delete('inventory/:id')
  async deleteInventoryById(@Param('id') id: string) {
    return this.stockService.deleteInventoryItemById(id);
  }
  @Delete('reservations/:id')
  async deleteReservation(@Param('id') id: string, @Query('reference') reference?: string) {
    return this.stockService.cancelReservation(Number(id), reference);
  }
}
