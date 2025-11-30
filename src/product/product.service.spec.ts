import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Sku } from '../sku/entities/sku.entity';
import { StockService } from '../stock/stock.service';
import { Repository } from 'typeorm';

describe('ProductService', () => {
  let service: ProductService;
  let productRepo: Repository<Product>;
  let skuRepo: Repository<Sku>;
  let stockService: StockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            manager: {
              transaction: jest.fn(fn => fn({
                save: jest.fn(),
                delete: jest.fn(),
                update: jest.fn(),
                create: jest.fn(),
                findOne: jest.fn(),
              })),
            },
          },
        },
        {
          provide: getRepositoryToken(Sku),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: StockService,
          useValue: {
            createInventory: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    skuRepo = module.get<Repository<Sku>>(getRepositoryToken(Sku));
    stockService = module.get<StockService>(StockService);
  });

  describe('createProduct', () => {
    it('should throw if name is missing', async () => {
      await expect(service.createProduct({ name: '' } as any)).rejects.toThrow();
    });

    it('should create product and skus', async () => {
      (productRepo.create as any).mockImplementation(dto => ({ ...dto, id: 1 }));
      (productRepo.save as any).mockResolvedValue({ id: 1, name: 'Test' });
      (skuRepo.create as any).mockImplementation(dto => ({ ...dto, id: Math.floor(Math.random() * 1000) }));
      (skuRepo.save as any).mockResolvedValue({ id: 2, skuCode: 'SKU-001' });
      (productRepo.findOne as any).mockResolvedValue({ id: 1, name: 'Test', skus: [{ id: 2, skuCode: 'SKU-001' }] });

      const dto = {
        name: 'Test',
        skus: [{ skuCode: 'SKU-001', attributes: { color: 'red' } }],
      };
      const result = await service.createProduct(dto as any);
      expect(result).toHaveProperty('id', 1);
      expect(result.skus.length).toBeGreaterThan(0);
    });

    it('should seed central inventory if centralStoreId and initialCentralStock provided', async () => {
      (productRepo.create as any).mockImplementation(dto => ({ ...dto, id: 2 }));
      (productRepo.save as any).mockResolvedValue({ id: 2, name: 'Test2' });
      (skuRepo.create as any).mockImplementation(dto => ({ ...dto, id: 3 }));
      (skuRepo.save as any).mockResolvedValue({ id: 3, skuCode: 'SKU-002' });
      (productRepo.findOne as any).mockResolvedValue({ id: 2, name: 'Test2', skus: [{ id: 3, skuCode: 'SKU-002' }] });

      const dto = {
        name: 'Test2',
        centralStoreId: 1,
        skus: [{ skuCode: 'SKU-002', attributes: { color: 'blue' }, initialCentralStock: 10 }],
      };
      await service.createProduct(dto as any);
      expect(stockService.createInventory).toHaveBeenCalled();
    });

    it('should throw if product creation fails', async () => {
      (productRepo.create as any).mockImplementation(dto => ({ ...dto, id: 99 }));
      (productRepo.save as any).mockResolvedValue({ id: 99, name: 'Fail' });
      (productRepo.findOne as any).mockResolvedValue(null);
      await expect(service.createProduct({ name: 'Fail' } as any)).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should throw if id missing', async () => {
      await expect(service.findOne(undefined as any)).rejects.toThrow();
    });

    it('should throw if product not found', async () => {
      (productRepo.findOne as any).mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow();
    });

    it('should return product if found', async () => {
      (productRepo.findOne as any).mockResolvedValue({ id: 1, name: 'Test', skus: [] });
      const result = await service.findOne(1);
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'Test');
    });
  });

  describe('find', () => {
    it('should return paginated products', async () => {
      (productRepo.findAndCount as any).mockResolvedValue([[{ id: 1, name: 'Test', skus: [] }], 1]);
      const result = await service.find({ page: 1, pageSize: 10 });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });

    it('should search by name/category', async () => {
      (productRepo.findAndCount as any).mockResolvedValue([[{ id: 2, name: 'Search', skus: [] }], 1]);
      const result = await service.find({ page: 1, pageSize: 10, search: 'Search' });
      expect(result.data[0].name).toBe('Search');
    });
  });

  describe('updateProduct', () => {
    it('should throw if id missing', async () => {
      await expect(service.updateProduct(undefined as any, {})).rejects.toThrow();
    });

    it('should throw if product not found', async () => {
      (productRepo.findOne as any).mockResolvedValue(null);
      await expect(service.updateProduct(99, {})).rejects.toThrow();
    });

    it('should update scalar fields and return product', async () => {
      const product = { id: 1, name: 'Old', category: 'Cat', price: 10, description: 'Desc', skus: [] };
      (productRepo.findOne as any).mockResolvedValue(product);
      (productRepo.manager.transaction as any).mockImplementation(async fn => {
        return await fn({
          save: jest.fn().mockResolvedValue({ ...product, name: 'New', category: 'NewCat', price: 20, description: 'NewDesc' }),
          update: jest.fn(),
          delete: jest.fn(),
          create: jest.fn(),
          findOne: jest.fn().mockResolvedValue({ ...product, name: 'New', category: 'NewCat', price: 20, description: 'NewDesc', skus: [] }),
        });
      });
      const result = await service.updateProduct(1, { name: 'New', category: 'NewCat', price: 20, description: 'NewDesc' });
      expect(result).toHaveProperty('name', 'New');
      expect(result).toHaveProperty('category', 'NewCat');
      expect(result).toHaveProperty('price', 20);
      expect(result).toHaveProperty('description', 'NewDesc');
    });

    it('should handle SKU updates and creation', async () => {
      const product = { id: 1, name: 'Old', skus: [{ id: 2, skuCode: 'SKU-OLD' }] };
      (productRepo.findOne as any).mockResolvedValue(product);
      (productRepo.manager.transaction as any).mockImplementation(async fn => {
        return await fn({
          save: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          create: jest.fn().mockReturnValue({ id: 3, skuCode: 'SKU-NEW' }),
          findOne: jest.fn().mockResolvedValue({ ...product, skus: [{ id: 2, skuCode: 'SKU-UPDATED' }, { id: 3, skuCode: 'SKU-NEW' }] }),
        });
      });
      const result = await service.updateProduct(1, {
        skus: [
          { id: 2, skuCode: 'SKU-UPDATED', attributes: { color: 'blue' } },
          { skuCode: 'SKU-NEW', attributes: { color: 'green' } },
        ],
      });
      expect(result.skus.length).toBe(2);
      expect(result.skus[0].skuCode).toBe('SKU-UPDATED');
      expect(result.skus[1].skuCode).toBe('SKU-NEW');
    });

    it('should throw if updated product not found after transaction', async () => {
      const product = { id: 1, name: 'Old', skus: [] };
      (productRepo.findOne as any).mockResolvedValue(product);
      (productRepo.manager.transaction as any).mockImplementation(async fn => {
        return await fn({
          save: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          create: jest.fn(),
          findOne: jest.fn().mockResolvedValue(null),
        });
      });
      await expect(service.updateProduct(1, { name: 'New' })).rejects.toThrow();
    });
  });

  describe('deleteProduct', () => {
    it('should throw if id missing', async () => {
      await expect(service.deleteProduct(undefined as any)).rejects.toThrow();
    });

    it('should throw if product not found', async () => {
      (productRepo.findOne as any).mockResolvedValue(null);
      await expect(service.deleteProduct(99)).rejects.toThrow();
    });

    it('should delete product and skus', async () => {
      const product = { id: 1, name: 'Del', skus: [{ id: 2 }, { id: 3 }] };
      (productRepo.findOne as any).mockResolvedValue(product);
      (productRepo.manager.transaction as any).mockImplementation(async fn => {
        await fn({
          delete: jest.fn(),
        });
      });
      const result = await service.deleteProduct(1);
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('deleted', true);
    });
  });
});