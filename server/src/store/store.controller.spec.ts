import { Test, TestingModule } from '@nestjs/testing';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';

describe('StoreController', () => {
  let controller: StoreController;
  let service: StoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreController],
      providers: [
        {
          provide: StoreService,
          useValue: {
            createStore: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            find: jest.fn(),
            getStoresByCentralField: jest.fn(),
            updateStore: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StoreController>(StoreController);
    service = module.get<StoreService>(StoreService);
  });

  describe('create', () => {
    it('should call service.createStore and return result', async () => {
      const dto: CreateStoreDto = { name: 'Branch', location: 'Loc', isCentral: false };
      (service.createStore as jest.Mock).mockResolvedValue({ id: 1, ...dto });
      const result = await controller.create(dto);
      expect(service.createStore).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('getOne', () => {
    it('should call service.findOne and return result', async () => {
      (service.findOne as jest.Mock).mockResolvedValue({ id: 2, name: 'Central' });
      const result = await controller.getOne('2');
      expect(service.findOne).toHaveBeenCalledWith(2);
      expect(result).toHaveProperty('id', 2);
    });
  });

  describe('list', () => {
    it('should call getStoresByCentralField(true) if isCentral is "true"', async () => {
      (service.getStoresByCentralField as jest.Mock).mockResolvedValue([{ id: 1, isCentral: true }]);
      const result = await controller.list('1', '10', 'true');
      expect(service.getStoresByCentralField).toHaveBeenCalledWith(true);
      expect(result[0]).toHaveProperty('isCentral', true);
    });

    it('should call getStoresByCentralField(false) if isCentral is "false"', async () => {
      (service.getStoresByCentralField as jest.Mock).mockResolvedValue([{ id: 2, isCentral: false }]);
      const result = await controller.list('1', '10', 'false');
      expect(service.getStoresByCentralField).toHaveBeenCalledWith(false);
      expect(result[0]).toHaveProperty('isCentral', false);
    });

    it('should call findAll if isCentral is not provided', async () => {
      (service.findAll as jest.Mock).mockResolvedValue({ data: [{ id: 1 }], meta: { total: 1 } });
      const result = await controller.list('1', '10');
      expect(service.findAll).toHaveBeenCalledWith(1, 10);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    });
  });

  describe('get', () => {
    it('should call service.find with isCentral param', async () => {
      (service.find as jest.Mock).mockResolvedValue([{ id: 1, isCentral: true }]);
      const result = await controller.get(true);
      expect(service.find).toHaveBeenCalledWith(true);
      expect(result[0]).toHaveProperty('isCentral', true);
    });

    it('should call service.find with default param', async () => {
      (service.find as jest.Mock).mockResolvedValue([{ id: 2, isCentral: false }]);
      const result = await controller.get(undefined);
      expect(service.find).toHaveBeenCalledWith(false);
      expect(result[0]).toHaveProperty('isCentral', false);
    });
  });

  describe('update', () => {
    it('should call service.updateStore and return result', async () => {
      (service.updateStore as jest.Mock).mockResolvedValue({ id: 1, name: 'Updated', location: 'Loc' });
      const result = await controller.update('1', { name: 'Updated', location: 'Loc' });
      expect(service.updateStore).toHaveBeenCalledWith(1, { name: 'Updated', location: 'Loc' });
      expect(result).toHaveProperty('name', 'Updated');
    });
  });
});