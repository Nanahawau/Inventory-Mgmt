import { Test, TestingModule } from '@nestjs/testing';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

describe('StockController', () => {
  let controller: StockController;
  let service: StockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        {
          provide: StockService,
          useValue: {
            reserve: jest.fn(),
            moveFromCentral: jest.fn(),
            findReservations: jest.fn(),
            findTransfers: jest.fn(),
            adjustSkuStock: jest.fn(),
            getSkuStock: jest.fn(),
            createInventory: jest.fn(),
            findInventory: jest.fn(),
            deleteInventoryItemById: jest.fn(),
            cancelReservation: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StockController>(StockController);
    service = module.get<StockService>(StockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createReservation', () => {
    it('should call service.reserve and return result', async () => {
      (service.reserve as jest.Mock).mockResolvedValue({ id: 1 });
      const dto = { inventoryItemId: 1, skuId: 2, quantity: 5 };
      const result = await controller.createReservation(dto);
      expect(service.reserve).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('transferStock', () => {
    it('should call service.moveFromCentral and return result', async () => {
      (service.moveFromCentral as jest.Mock).mockResolvedValue({ success: true });
      const dto = { centralInventoryItemId: 1, toStoreId: 2, productId: 3, skuId: 4, quantity: 5 };
      const result = await controller.transferStock(dto);
      expect(service.moveFromCentral).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('listReservation', () => {
    it('should call service.findReservations and return result', async () => {
      (service.findReservations as jest.Mock).mockResolvedValue({ data: [], meta: { total: 0 } });
      const result = await controller.listReservation('1', '2', 'active', '1', '10');
      expect(service.findReservations).toHaveBeenCalledWith({
        inventoryItemId: '1',
        skuId: '2',
        status: 'active',
        page: 1,
        pageSize: 10,
      });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });
  });

  describe('getSkuStock', () => {
    it('should call service.getSkuStock and return result', async () => {
      (service.getSkuStock as jest.Mock).mockResolvedValue({ id: 1, stock: 10 });
      const result = await controller.getSkuStock('1');
      expect(service.getSkuStock).toHaveBeenCalledWith('1');
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('createInventory', () => {
    it('should call service.createInventory and return result', async () => {
      (service.createInventory as jest.Mock).mockResolvedValue({ id: 1 });
      const dto = { storeId: 1, productId: 2, skuStocks: [] };
      const result = await controller.createInventory(dto);
      expect(service.createInventory).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('listInventory', () => {
    it('should call service.findInventory and return result', async () => {
      (service.findInventory as jest.Mock).mockResolvedValue({ data: [], meta: { total: 0 } });
      const result = await controller.listInventory('1', '2', '1', '10');
      expect(service.findInventory).toHaveBeenCalledWith({
        storeId: '1',
        productId: '2',
        page: 1,
        pageSize: 10,
      });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });
  });

  describe('deleteInventoryById', () => {
    it('should call service.deleteInventoryItemById and return result', async () => {
      (service.deleteInventoryItemById as jest.Mock).mockResolvedValue({ success: true });
      const result = await controller.deleteInventoryById('1');
      expect(service.deleteInventoryItemById).toHaveBeenCalledWith('1');
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('deleteReservation', () => {
    it('should call service.cancelReservation and return result', async () => {
      (service.cancelReservation as jest.Mock).mockResolvedValue({ cancelled: true });
      const result = await controller.deleteReservation('1', 'ref');
      expect(service.cancelReservation).toHaveBeenCalledWith(1, 'ref');
      expect(result).toHaveProperty('cancelled', true);
    });
  });
});