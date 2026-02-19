import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const code =
      exception instanceof HttpException
        ? this.codeFromException(exception)
        : 'INTERNAL_ERROR';

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'An unexpected error occurred';

    let details: unknown =
      exception instanceof HttpException
        ? (exception.getResponse() as Record<string, unknown>)?.message ?? undefined
        : undefined;
    if (details === undefined && status >= 500 && exception instanceof Error && process.env.NODE_ENV !== 'production') {
      details = exception.message;
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorResponse = {
      code,
      message: typeof message === 'string' ? message : 'Error',
      ...(details !== undefined && { details }),
    };

    response.status(status).json(body);
  }

  private codeFromException(exception: HttpException): string {
    const status = exception.getStatus();
    const res = exception.getResponse();
    const code = (res as Record<string, string>)?.error;
    if (typeof code === 'string') return code;
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      default:
        return 'ERROR';
    }
  }
}
