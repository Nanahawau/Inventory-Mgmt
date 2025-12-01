import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: UserService,
          useValue: {
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    userService = module.get<UserService>(UserService);
  });

  describe('login', () => {
    it('should call userService.login and return result', async () => {
      const dto: LoginDto = { email: 'admin@gmail.com', password: 'admin' };
      (userService.login as jest.Mock).mockResolvedValue({ access_token: 'jwt-token' });
      const result = await controller.login(dto);
      expect(userService.login).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('access_token', 'jwt-token');
    });
  });
});