import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InventoryItem } from './entities/inventoryitems.entity';
import { SkuStock } from './entities/skustock.entity';
import { Reservation } from './entities/reservation.entity';
import { StockMovement } from './entities/stockmovement.entity';
import { Store } from '../store/entities/store.entity';
import { Product } from '../product/entities/product.entity';
import { Sku } from '../sku/entities/sku.entity';

describe('StockService', () => {
  let service: StockService;
  let inventoryRepo: Repository<InventoryItem>;
  let skuStockRepo: Repository<SkuStock>;
  let reservationRepo: Repository<Reservation>;
  let movementRepo: Repository<StockMovement>;
  let storeRepo: Repository<Store>;
  let productRepo: Repository<Product>;
  let skuRepo: Repository<Sku>;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: DataSource, useValue: { transaction: jest.fn(fn => fn({ getRepository: jest.fn().mockImplementation(token => module.get(token)) })) } },
        { provide: getRepositoryToken(InventoryItem), useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), find: jest.fn(), delete: jest.fn(), createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(SkuStock), useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), find: jest.fn(), delete: jest.fn(), createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(Reservation), useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), find: jest.fn(), delete: jest.fn(), createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(StockMovement), useValue: { create: jest.fn(), save: jest.fn(), find: jest.fn() } },
        { provide: getRepositoryToken(Store), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(Product), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(Sku), useValue: { findOne: jest.fn() } },
      ],
    }).compile();

   

    service = module.get<StockService>(StockService);
    inventoryRepo = module.get<Repository<InventoryItem>>(getRepositoryToken(InventoryItem));
    skuStockRepo = module.get<Repository<SkuStock>>(getRepositoryToken(SkuStock));
    reservationRepo = module.get<Repository<Reservation>>(getRepositoryToken(Reservation));
    movementRepo = module.get<Repository<StockMovement>>(getRepositoryToken(StockMovement));
    storeRepo = module.get<Repository<Store>>(getRepositoryToken(Store));
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    skuRepo = module.get<Repository<Sku>>(getRepositoryToken(Sku));
    dataSource = module.get<DataSource>(DataSource);
  });

   afterEach(() => {
      jest.restoreAllMocks();
    });

  describe('createInventory', () => {
    it('should throw if storeId or productId missing', async () => {
      await expect(service.createInventory({ storeId: 1, productId: 1, skuStocks: [] })).rejects.toThrow();
    });

    it('should create inventory and return full inventory', async () => {
      (inventoryRepo.findOne as any).mockResolvedValueOnce(null);
      (storeRepo.findOne as any).mockResolvedValue({ id: 2 });
      (productRepo.findOne as any).mockResolvedValue({ id: 3 });
      (inventoryRepo.create as any).mockImplementation(dto => ({ ...dto, id: 1 }));
      (inventoryRepo.save as any).mockResolvedValue({ id: 1, store: { id: 2 }, product: { id: 3 } });
      (inventoryRepo.findOne as any).mockResolvedValueOnce({ id: 1, store: { id: 2 }, product: { id: 3 }, skuStocks: [] });
      const result = await service.createInventory({ storeId: 2, productId: 3, skuStocks: [] });
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('store');
      expect(result).toHaveProperty('product');
    });
  });

  describe('findInventory', () => {
    it('should return paginated inventory', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
      };
      (inventoryRepo.createQueryBuilder as any).mockReturnValue(qb);
      const result = await service.findInventory({ page: 1, pageSize: 1 });
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('data');
      expect(result.data.length).toBe(1);
    });
  });

  describe('getSkuStock', () => {
    it('should throw if id invalid', async () => {
      await expect(service.getSkuStock('')).rejects.toThrow();
    });

    it('should throw if not found', async () => {
      (skuStockRepo.findOne as any).mockResolvedValue(null);
      await expect(service.getSkuStock(99)).rejects.toThrow();
    });

    it('should return skuStock if found', async () => {
      (skuStockRepo.findOne as any).mockResolvedValue({ id: 1 });
      const result = await service.getSkuStock(1);
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('reserve', () => {
    it('should throw if payload invalid', async () => {
      await expect(service.reserve({ inventoryItemId: 4, skuId: 5, quantity: 0 })).rejects.toThrow();
    });

    it('should throw if skuStock not found', async () => {
      const qb: any = { getOne: jest.fn().mockResolvedValue(null), setLock: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis() };
      (skuStockRepo.createQueryBuilder as any).mockReturnValue(qb);
      await expect(service.reserve({ inventoryItemId: 1, skuId: 2, quantity: 1 })).rejects.toThrow();
    });

    it('should throw if insufficient available stock', async () => {
      const qb: any = {
        getOne: jest.fn().mockResolvedValue({ stock: 5, reserved: 5, id: 1 }),
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis()
      };
      (skuStockRepo.createQueryBuilder as any).mockReturnValue(qb);
      await expect(service.reserve({ inventoryItemId: 1, skuId: 2, quantity: 1 })).rejects.toThrow();
    });
  });

  describe('createTransfer', () => {
    it('should throw if payload invalid', async () => {
      await expect(service.createTransfer({ reservationId: 1, toInventoryItemId: 3, quantity: 0 })).rejects.toThrow();
    });

    it('should throw if reservation not found', async () => {
      (reservationRepo.findOne as any).mockResolvedValue(null);
      await expect(service.createTransfer({ reservationId: 1, toInventoryItemId: 2, quantity: 1 })).rejects.toThrow();
    });

    it('should throw if reservation not active', async () => {
      (reservationRepo.findOne as any).mockResolvedValue({ id: 1, status: 'cancelled' });
      await expect(service.createTransfer({ reservationId: 1, toInventoryItemId: 2, quantity: 1 })).rejects.toThrow();
    });

    it('should throw if reservation expired', async () => {
      (reservationRepo.findOne as any).mockResolvedValue({ id: 1, status: 'active', expiresAt: new Date(Date.now() - 1000) });
      await expect(service.createTransfer({ reservationId: 1, toInventoryItemId: 2, quantity: 1 })).rejects.toThrow();
    });

    it('should throw if quantity exceeds reservation', async () => {
      (reservationRepo.findOne as any).mockResolvedValue({ id: 1, status: 'active', expiresAt: new Date(Date.now() + 10000), quantity: 1, inventoryItem: { id: 1 }, sku: { id: 2 } });
      await expect(service.createTransfer({ reservationId: 1, toInventoryItemId: 2, quantity: 2 })).rejects.toThrow();
    });

    it('should throw if source sku stock not found', async () => {
      (reservationRepo.findOne as any).mockResolvedValue({ id: 1, status: 'active', expiresAt: new Date(Date.now() + 10000), quantity: 1, inventoryItem: { id: 1 }, sku: { id: 2 } });
      const qb: any = { getOne: jest.fn().mockResolvedValue(null), setLock: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis() };
      (skuStockRepo.createQueryBuilder as any).mockReturnValue(qb);
      await expect(service.createTransfer({ reservationId: 1, toInventoryItemId: 2, quantity: 1 })).rejects.toThrow();
    });

    it('should throw if insufficient reserved quantity in source', async () => {
      (reservationRepo.findOne as any).mockResolvedValue({ id: 1, status: 'active', expiresAt: new Date(Date.now() + 10000), quantity: 2, inventoryItem: { id: 1 }, sku: { id: 2 } });
      const qb: any = { getOne: jest.fn().mockResolvedValue({ reserved: 1, stock: 2, id: 1 }), setLock: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis() };
      (skuStockRepo.createQueryBuilder as any).mockReturnValue(qb);
      await expect(service.createTransfer({ reservationId: 1, toInventoryItemId: 2, quantity: 2 })).rejects.toThrow();
    });

    it('should throw if insufficient physical stock in source', async () => {
      (reservationRepo.findOne as any).mockResolvedValue({ id: 1, status: 'active', expiresAt: new Date(Date.now() + 10000), quantity: 2, inventoryItem: { id: 1 }, sku: { id: 2 } });
      const qb: any = { getOne: jest.fn().mockResolvedValue({ reserved: 2, stock: 1, id: 1 }), setLock: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis() };
      (skuStockRepo.createQueryBuilder as any).mockReturnValue(qb);
      await expect(service.createTransfer({ reservationId: 1, toInventoryItemId: 2, quantity: 2 })).rejects.toThrow();
    });
  });

  describe('moveFromCentral', () => {

    it('should throw if destination inventory creation fails', async () => {
      (inventoryRepo.findOne as any).mockResolvedValueOnce(null);
      jest.spyOn(service, 'createInventory').mockResolvedValueOnce(null);
      await expect(service.moveFromCentral({ centralInventoryItemId: 1, toStoreId: 2, productId: 3, skuId: 4, quantity: 5 })).rejects.toThrow();
    });

    it('should throw if reservation not found', async () => {
      (inventoryRepo.findOne as any).mockResolvedValueOnce({ id: 10 });
      (reservationRepo.findOne as any).mockResolvedValue(null);
      await expect(service.moveFromCentral({ centralInventoryItemId: 1, toStoreId: 2, productId: 3, skuId: 4, quantity: 5 })).rejects.toThrow();
    });

    it('should throw if central sku stock not found', async () => {
      (inventoryRepo.findOne as any).mockResolvedValueOnce({ id: 10 });
      (reservationRepo.findOne as any).mockResolvedValue({ id: 20, status: 'active', quantity: 5 });
      (skuStockRepo.findOne as any).mockResolvedValueOnce(null);
      await expect(service.moveFromCentral({ centralInventoryItemId: 1, toStoreId: 2, productId: 3, skuId: 4, quantity: 5 })).rejects.toThrow();
    });
  });

  describe('findReservations', () => {
    it('should return paginated reservations', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
      };
      (reservationRepo.createQueryBuilder as any).mockReturnValue(qb);
      const result = await service.findReservations({ page: 1, pageSize: 1 });
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('data');
      expect(result.data.length).toBe(1);
    });
  });

  describe('deleteInventoryItemById', () => {
    it('should throw if id invalid', async () => {
      await expect(service.deleteInventoryItemById('', '')).rejects.toThrow();
    });

    it('should throw if inventory item not found', async () => {
      (inventoryRepo.findOne as any).mockResolvedValue(null);
      await expect(service.deleteInventoryItemById(99, '')).rejects.toThrow();
    });
  });

  describe('cancelReservation', () => {
    it('should throw if reservation id invalid', async () => {
      await expect(service.cancelReservation('', '')).rejects.toThrow();
    });

    it('should throw if reservation not found', async () => {
      const qb: any = { getOne: jest.fn().mockResolvedValue(null), setLock: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis() };
      (reservationRepo.createQueryBuilder as any).mockReturnValue(qb);
      await expect(service.cancelReservation(99, '')).rejects.toThrow();
    });

    it('should throw if reservation not active', async () => {
      const qb: any = { getOne: jest.fn().mockResolvedValue({ status: 'fulfilled' }), setLock: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis() };
      (reservationRepo.createQueryBuilder as any).mockReturnValue(qb);
      await expect(service.cancelReservation(1, '')).rejects.toThrow();
    });
  });
});