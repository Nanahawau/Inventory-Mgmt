import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsDto } from './dto/list-product.dto';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            createProduct: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            updateProduct: jest.fn(),
            deleteProduct: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
  });

  describe('create', () => {
    it('should call service.createProduct and return result', async () => {
      const dto: CreateProductDto = { name: 'Test', skus: [] };
      (service.createProduct as jest.Mock).mockResolvedValue({ id: 1, ...dto });
      const result = await controller.create(dto);
      expect(service.createProduct).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('getOne', () => {
    it('should call service.findOne and return result', async () => {
      (service.findOne as jest.Mock).mockResolvedValue({ id: 2, name: 'Product' });
      const result = await controller.getOne(2);
      expect(service.findOne).toHaveBeenCalledWith(2);
      expect(result).toHaveProperty('id', 2);
    });
  });

  describe('get', () => {
    it('should call service.find and return result', async () => {
      const query: ListProductsDto = { page: 1, pageSize: 10, search: '' };
      (service.find as jest.Mock).mockResolvedValue({ data: [{ id: 3 }], meta: { total: 1 } });
      const result = await controller.get(query);
      expect(service.find).toHaveBeenCalledWith(query);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });
  });

  describe('update', () => {
    it('should call service.updateProduct and return result', async () => {
      const dto: UpdateProductDto = { name: 'Updated' };
      (service.updateProduct as jest.Mock).mockResolvedValue({ id: 4, name: 'Updated' });
      const result = await controller.update(4, dto);
      expect(service.updateProduct).toHaveBeenCalledWith(4, dto);
      expect(result).toHaveProperty('name', 'Updated');
    });
  });

  describe('delete', () => {
    it('should call service.deleteProduct and return result', async () => {
      (service.deleteProduct as jest.Mock).mockResolvedValue({ id: 5, deleted: true });
      const result = await controller.delete(5);
      expect(service.deleteProduct).toHaveBeenCalledWith(5);
      expect(result).toHaveProperty('deleted', true);
    });
  });
});