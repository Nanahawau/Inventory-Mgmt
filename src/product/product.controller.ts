import { Controller, Post, Body, UsePipes, ValidationPipe, Get, Param } from "@nestjs/common";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/create-product.dto";


@Controller("api/products")
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async create(@Body() body: CreateProductDto) {
    return this.productService.createProduct(body);
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const nid = Number(id);
    return this.productService.findOne(nid);
  }

  @Get()
  async get() {
    return this.productService.find();
  }
}