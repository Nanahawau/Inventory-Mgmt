import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IsPublic } from '../common/decorators/public.decorator';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  @IsPublic()
  async login(@Body() loginDto: LoginDto) {
    return this.userService.login(loginDto);
  }
}
