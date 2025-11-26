import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigType } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [jwtConfig.KEY],
      useFactory: (cfg: ConfigType<typeof jwtConfig>) => ({
        secret: cfg.secret,
        signOptions: { expiresIn: '1h' },
      }),
    }),],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
