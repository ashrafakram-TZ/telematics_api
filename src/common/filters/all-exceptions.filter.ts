import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { EMPTY, Observable } from 'rxjs';
import { EntityNotFoundError, QueryFailedError } from 'typeorm';

interface ErrorResult {
  status: number;
  message: string;
}

interface PgError {
  code?: string;
  detail?: string;
  column?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): Observable<never> | void {
    if (host.getType() !== 'http') {
      this.logger.error(`Dropped ${host.getType()} message: ${this.describe(exception)}`, (exception as Error)?.stack);
      return EMPTY;
    }

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { status, message } = this.resolve(exception);
    const route = `${request.method} ${request.originalUrl}`;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${route} ${status} ${this.describe(exception)}`, (exception as Error)?.stack);
    } else {
      this.logger.warn(`${route} ${status} ${message}`);
    }

    response.status(status).json({ status, error: this.code(status), message });
  }

  private resolve(exception: unknown): ErrorResult {
    if (exception instanceof HttpException) {
      return { status: exception.getStatus(), message: this.httpMessage(exception) };
    }
    if (exception instanceof QueryFailedError) {
      return this.queryError(exception.driverError as PgError);
    }
    if (exception instanceof EntityNotFoundError) {
      return { status: HttpStatus.NOT_FOUND, message: 'Resource not found' };
    }
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
  }

  private httpMessage(exception: HttpException): string {
    const body = exception.getResponse();
    if (typeof body === 'string') return body;
    const message = (body as { message?: unknown }).message;
    if (Array.isArray(message)) return String(message[0]);
    if (typeof message === 'string') return message;
    return exception.message;
  }

  private queryError(error: PgError): ErrorResult {
    switch (error.code) {
      case '23505': {
        const field = /Key \(([^)]+)\)=/.exec(error.detail ?? '')?.[1] ?? 'Value';
        return { status: HttpStatus.CONFLICT, message: `${field} already exists` };
      }
      case '23503':
        return { status: HttpStatus.CONFLICT, message: 'Referenced record not found or in use' };
      case '22P02':
        return { status: HttpStatus.BAD_REQUEST, message: 'Invalid input' };
      case '23502':
        return { status: HttpStatus.BAD_REQUEST, message: `${error.column ?? 'Field'} is required` };
      default:
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
    }
  }

  private code(status: number): string {
    return HttpStatus[status] ?? (status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  }

  private describe(exception: unknown): string {
    return exception instanceof Error ? exception.message : String(exception);
  }
}
