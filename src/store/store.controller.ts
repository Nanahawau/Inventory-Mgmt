import { Controller, Post, Body, UsePipes, ValidationPipe, Get, Param } from "@nestjs/common";
import { StoreService } from "./store.service";
import { CreateStoreDto } from "./dto/create-store.dto";

/**
 * StoreController
 * - POST /api/stores -> create a store
 * - GET  /api/stores/:id -> get a store
 */
@Controller("api/stores")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

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
  async get() {
    return this.storeService.find();
  }
}