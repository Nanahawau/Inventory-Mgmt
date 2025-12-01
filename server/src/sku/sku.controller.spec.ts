import { Test, TestingModule } from '@nestjs/testing';
import { SkuController } from './sku.controller';
import { SkuService } from './sku.service';

describe('SkuController', () => {
  let controller: SkuController;
  let service: SkuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkuController],
      providers: [
        {
          provide: SkuService,
          useValue: {
            findAll: jest.fn(),
            findByProduct: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SkuController>(SkuController);
    service = module.get<SkuService>(SkuService);
  });

  describe('findAll', () => {
    it('should call findByProduct if productId is provided', async () => {
      (service.findByProduct as jest.Mock).mockResolvedValue({ data: [{ id: 1 }], meta: { total: 1 } });
      const result = await controller.findAll('5', '1', '10', 'search');
      expect(service.findByProduct).toHaveBeenCalledWith({
        productId: 5,
        page: 1,
        pageSize: 10,
        search: 'search',
      });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });

    it('should call findAll if productId is not provided', async () => {
      (service.findAll as jest.Mock).mockResolvedValue({ data: [{ id: 2 }], meta: { total: 1 } });
      const result = await controller.findAll(undefined, '2', '20', 'abc');
      expect(service.findAll).toHaveBeenCalledWith({ page: 2, pageSize: 20, search: 'abc' });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });
  });

  describe('findOne', () => {
    it('should call findOne with id', async () => {
      (service.findOne as jest.Mock).mockResolvedValue({ id: 3, skuCode: 'SKU-003' });
      const result = await controller.findOne('3');
      expect(service.findOne).toHaveBeenCalledWith(3);
      expect(result).toHaveProperty('id', 3);
      expect(result).toHaveProperty('skuCode', 'SKU-003');
    });
  });
});