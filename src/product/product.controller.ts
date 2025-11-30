import { Controller, Post, Body, UsePipes, ValidationPipe, Get, Param, Put, Delete, ParseIntPipe, Query } from "@nestjs/common";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ListProductsDto } from "./dto/list-product.dto";

@Controller("products")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(@Body() body: CreateProductDto) {
    return this.productService.createProduct(body);
  }

  @Get(":id")
  async getOne(@Param("id", ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Get()
  async get(@Query() query: ListProductsDto) {
    const data = await this.productService.find(query);
    return data;
  }

  @Put(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() body: UpdateProductDto) {
    return this.productService.updateProduct(id, body);
  }

  @Delete(":id")
  async delete(@Param("id", ParseIntPipe) id: number) {
    return this.productService.deleteProduct(id);
  }
}