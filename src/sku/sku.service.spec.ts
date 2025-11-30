import { Test, TestingModule } from '@nestjs/testing';
import { SkuService } from './sku.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Sku } from './entities/sku.entity';
import { Repository } from 'typeorm';

describe('SkuService', () => {
  let service: SkuService;
  let repo: Repository<Sku>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkuService,
        {
          provide: getRepositoryToken(Sku),
          useValue: {
            findAndCount: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SkuService>(SkuService);
    repo = module.get<Repository<Sku>>(getRepositoryToken(Sku));
  });

  describe('findAll', () => {
    it('should return paginated SKUs', async () => {
      (repo.findAndCount as jest.Mock).mockResolvedValue([[{ id: 1, skuCode: 'SKU-001' }], 1]);
      const result = await service.findAll({ page: 1, pageSize: 10 });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });

    it('should search by skuCode', async () => {
      (repo.findAndCount as jest.Mock).mockResolvedValue([[{ id: 2, skuCode: 'SKU-ABC' }], 1]);
      const result = await service.findAll({ page: 1, pageSize: 10, search: 'ABC' });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { skuCode: expect.any(Object) },
        })
      );
      expect(result.data[0].skuCode).toBe('SKU-ABC');
    });
  });

  describe('findByProduct', () => {
    it('should return SKUs for a product', async () => {
      (repo.findAndCount as jest.Mock).mockResolvedValue([[{ id: 3, skuCode: 'SKU-XYZ', product: { id: 5 } }], 1]);
      const result = await service.findByProduct({ page: 1, pageSize: 10, productId: 5 });
      expect(result.data[0].product.id).toBe(5);
      expect(result.meta.total).toBe(1);
    });

    it('should search SKUs by skuCode for a product', async () => {
      (repo.findAndCount as jest.Mock).mockResolvedValue([[{ id: 4, skuCode: 'SKU-SEARCH', product: { id: 6 } }], 1]);
      const result = await service.findByProduct({ page: 1, pageSize: 10, productId: 6, search: 'SEARCH' });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            product: { id: 6 },
            skuCode: expect.any(Object),
          }),
        })
      );
      expect(result.data[0].skuCode).toBe('SKU-SEARCH');
    });
  });

  describe('findOne', () => {
    it('should return SKU by id', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({ id: 7, skuCode: 'SKU-007', product: { id: 8 } });
      const result = await service.findOne(7);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 7 }, relations: ['product'] });
      expect(result).toHaveProperty('id', 7);
      expect(result).toHaveProperty('skuCode', 'SKU-007');
    });
  });
});