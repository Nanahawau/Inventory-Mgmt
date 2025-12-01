import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  let repo: Repository<User>;
  let jwtService: JwtService;
  let compareSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('should throw if email or password missing', async () => {
      await expect(service.create({ email: '', password: '' })).rejects.toThrow();
      await expect(service.create({ email: 'test@test.com', password: '' })).rejects.toThrow();
      await expect(service.create({ email: '', password: 'pass' })).rejects.toThrow();
    });

    it('should throw if email already exists', async () => {
      (repo.findOne as any).mockResolvedValue({ id: 1, email: 'test@test.com', password: 'hashed' });
      await expect(service.create({ email: 'test@test.com', password: 'pass' })).rejects.toThrow();
    });

    it('should create and return sanitized user', async () => {
      (repo.findOne as any).mockResolvedValue(null);
      (repo.create as any).mockImplementation((u) => ({ ...u, id: 1, createdAt: new Date() }));
      (repo.save as any).mockResolvedValue({ id: 1, email: 'test@test.com', password: 'hashed', createdAt: new Date() });
      const result = await service.create({ email: 'test@test.com', password: 'pass' });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', 'test@test.com');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('findOneByEmail', () => {
    it('should return null if email is missing', async () => {
      expect(await service.findOneByEmail('')).toBeNull();
    });

    it('should return user if found', async () => {
      (repo.findOne as any).mockResolvedValue({ id: 1, email: 'test@test.com', password: 'hashed' });
      const user = await service.findOneByEmail('test@test.com');
      expect(user).toHaveProperty('email', 'test@test.com');
    });

    it('should return null if not found', async () => {
      (repo.findOne as any).mockResolvedValue(null);
      expect(await service.findOneByEmail('notfound@test.com')).toBeNull();
    });
  });


  describe('login', () => {
    it('should throw if invalid payload', async () => {
      await expect(service.login({})).rejects.toThrow();
    });

    it('should throw if credentials invalid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);
      await expect(service.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow();
    });

    it('should return token and user for valid credentials', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue({ id: 1, email: 'test@test.com', createdAt: new Date() });
      const result = await service.login({ email: 'test@test.com', password: 'pass' });
      expect(result).toHaveProperty('access_token', 'jwt-token');
      expect(result.user).toHaveProperty('email', 'test@test.com');
    });

    it('should return token and user for user entity', async () => {
      const user = { id: 1, email: 'test@test.com', createdAt: new Date() } as User;
      const result = await service.login(user);
      expect(result).toHaveProperty('access_token', 'jwt-token');
      expect(result.user).toHaveProperty('email', 'test@test.com');
    });
  });

  describe('userObject', () => {
    it('should return sanitized user object', () => {
      const user = { id: 1, email: 'test@test.com', password: 'hashed', createdAt: new Date() } as User;
      const obj = service.userObject(user);
      expect(obj).toEqual({
        id: 1,
        email: 'test@test.com',
        createdAt: user.createdAt,
      });
    });
  });
});