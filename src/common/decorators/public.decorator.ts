import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants';

/**
 * Decorator to mark a route as public (no JWT required).
 * Usage:
 *   @Controller('auth')
 *   export class AuthController {
 *     @Post('login')
 *     @IsPublic()
 *     login(...) { ... }
 *   }
 */
export const IsPublic = () => SetMetadata(IS_PUBLIC_KEY, true);