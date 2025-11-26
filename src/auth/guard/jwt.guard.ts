import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/common/constants';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Allow if handler is marked public
    const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
    if (isPublic) return true;

    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Malformed Authorization header');
    }

    const token = parts[1];
    try {
      const payload = await this.jwtService.verifyAsync(token);
      // attach user/payload to request for controllers to use
      (req as any).user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}