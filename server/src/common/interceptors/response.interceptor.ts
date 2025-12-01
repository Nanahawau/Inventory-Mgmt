import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGE_METADATA } from '../decorators/response-message.decorator';

export type Response<T> = {
  status: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errors?: any;
  meta?: any;
};

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  private readonly logger = new Logger(ResponseInterceptor.name);
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((res: any) => this.formatSuccess(res, context)),
      catchError((err: any) => throwError(() => this.formatError(err, context)))
    );
  }

  private formatSuccess(res: any, context: ExecutionContext): Response<T> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response?.statusCode ?? HttpStatus.OK;

    // If service returned { data, meta } allow it to be embedded
    if (res && typeof res === 'object' && ('data' in res || 'meta' in res)) {
      return {
        status: true,
        statusCode,
        message: this.getMessage(context),
        data: res.data ?? null,
        meta: res.meta ?? null
      };
    }

    return {
      status: true,
      statusCode,
      message: this.getMessage(context),
      data: res ?? null
    };
  }

  private formatError(exception: any, context: ExecutionContext) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object') {
        // Nest often sets { message, error } or { statusCode, message }
        message = (resp as any).message ?? (resp as any).error ?? message;
        errors = (resp as any).message && Array.isArray((resp as any).message) ? (resp as any).message : (resp as any).errors;
      }
    } else {
      // Non-HttpException: keep message but log full error
      message = exception?.message ?? message;
      this.logger.error('Unhandled exception', exception?.stack ?? exception);
    }

    // Ensure response is sent in consistent shape
    response.status(status).json({
      status: false,
      statusCode: status,
      message,
      errors: errors ?? undefined
    });

    // return an observable error for upstream handlers if any
    return new HttpException({ message, errors }, status);
  }

  private getMessage(context: ExecutionContext): string {
    return (
      this.reflector.get<string>(RESPONSE_MESSAGE_METADATA, context.getHandler()) ||
      'success'
    );
  }
}