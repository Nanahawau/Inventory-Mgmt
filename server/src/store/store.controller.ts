import { Controller, Post, Body, UsePipes, ValidationPipe, Get, Param, Query, Put } from "@nestjs/common";
import { StoreService } from "./store.service";
import { CreateStoreDto } from "./dto/create-store.dto";
import e from "express";

/**
 * StoreController
 * - POST /api/stores -> create a store
 * - GET  /api/stores/:id -> get a store
 */
@Controller("stores")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class StoreController {
  constructor(private readonly storeService: StoreService) { }

  @Post()
  async create(@Body() body: CreateStoreDto) {
    return this.storeService.createStore(body);
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const nid = Number(id);
    return this.storeService.findOne(nid);
  }

  @Get()
  async list(@Query('page') page = '1', @Query('pageSize') pageSize = '50', @Query('isCentral') isCentral?: string) {
    if (String(isCentral).toLowerCase() === 'true') {
      return this.storeService.getStoresByCentralField(true);
    } else if (String(isCentral).toLowerCase() === 'false') {
      return this.storeService.getStoresByCentralField(false);
    }
    return this.storeService.findAll(Number(page), Number(pageSize));
  }

  @Get()
  async get(@Query("isCentral") isCentral?: boolean) {
    return this.storeService.find(isCentral ?? false);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() body: Partial<CreateStoreDto>) {
    const nid = Number(id);
    return this.storeService.updateStore(nid, body);
  }
}