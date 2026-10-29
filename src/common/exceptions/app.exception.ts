import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(status: HttpStatus, message: string) {
    super(message, status);
  }

  static badRequest(message = 'Bad request'): AppException {
    return new AppException(HttpStatus.BAD_REQUEST, message);
  }

  static unauthorized(message = 'Unauthorized'): AppException {
    return new AppException(HttpStatus.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Forbidden'): AppException {
    return new AppException(HttpStatus.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found'): AppException {
    return new AppException(HttpStatus.NOT_FOUND, message);
  }

  static conflict(message = 'Conflict'): AppException {
    return new AppException(HttpStatus.CONFLICT, message);
  }
}
