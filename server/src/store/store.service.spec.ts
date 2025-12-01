import { Test, TestingModule } from '@nestjs/testing';
import { StoreService } from './store.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { Repository } from 'typeorm';

describe('StoreService', () => {
  let service: StoreService;
  let repo: Repository<Store>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreService,
        {
          provide: getRepositoryToken(Store),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StoreService>(StoreService);
    repo = module.get<Repository<Store>>(getRepositoryToken(Store));
  });

  describe('createStore', () => {
    it('should throw if name missing', async () => {
      await expect(service.createStore({ name: '', location: '', isCentral: false })).rejects.toThrow();
    });

    it('should create and return store', async () => {
      (repo.create as any).mockImplementation((dto) => ({ ...dto, id: 1 }));
      (repo.save as any).mockResolvedValue({ id: 1, name: 'Branch', location: 'Loc', isCentral: false });
      const result = await service.createStore({ name: 'Branch', location: 'Loc', isCentral: false });
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'Branch');
      expect(result).toHaveProperty('location', 'Loc');
      expect(result).toHaveProperty('isCentral', false);
    });
  });

  describe('findOne', () => {
    it('should throw if id missing', async () => {
      await expect(service.findOne(undefined as any)).rejects.toThrow();
    });

    it('should throw if store not found', async () => {
      (repo.findOne as any).mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow();
    });

    it('should return store if found', async () => {
      (repo.findOne as any).mockResolvedValue({ id: 2, name: 'Central', location: 'HQ', isCentral: true });
      const result = await service.findOne(2);
      expect(result).toHaveProperty('id', 2);
      expect(result).toHaveProperty('name', 'Central');
    });
  });

  describe('find', () => {
    it('should return stores by isCentral', async () => {
      (repo.find as any).mockResolvedValue([{ id: 1, isCentral: true }, { id: 2, isCentral: true }]);
      const result = await service.find(true);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('isCentral', true);
    });
  });

  describe('getStoresByCentralField', () => {
    it('should return stores by central field', async () => {
      (repo.find as any).mockResolvedValue([{ id: 1, isCentral: false }]);
      const result = await service.getStoresByCentralField(false);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('isCentral', false);
    });
  });

  describe('findAll', () => {
    it('should return paginated stores', async () => {
      const qb: any = {
        getCount: jest.fn().mockResolvedValue(2),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      };
      (repo.createQueryBuilder as any).mockReturnValue(qb);
      const result = await service.findAll(1, 2);
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('data');
      expect(result.data.length).toBe(2);
    });
  });

  describe('updateStore', () => {
    it('should throw if store not found', async () => {
      (repo.findOne as any).mockResolvedValue(null);
      await expect(service.updateStore(99, { name: 'New', location: 'Loc' })).rejects.toThrow();
    });

    it('should update and return store', async () => {
      const store = { id: 1, name: 'Old', location: 'OldLoc', isCentral: false };
      (repo.findOne as any).mockResolvedValue(store);
      (repo.save as any).mockResolvedValue({ ...store, name: 'New', location: 'Loc' });
      const result = await service.updateStore(1, { name: 'New', location: 'Loc' });
      expect(result).toHaveProperty('name', 'New');
      expect(result).toHaveProperty('location', 'Loc');
    });
  });
});