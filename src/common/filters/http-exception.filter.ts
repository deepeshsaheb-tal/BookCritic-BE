import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP exception filter for consistent error responses
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * Catch and format HTTP exceptions
   * @param exception - The caught exception
   * @param host - Arguments host
   */
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    // Extract error message and details
    let message: string;
    let errors: any[] = [];

    if (typeof errorResponse === 'string') {
      message = errorResponse;
    } else if (typeof errorResponse === 'object') {
      message = (errorResponse as any).message || 'An error occurred';
      errors = (errorResponse as any).errors || [];
    } else {
      message = 'An error occurred';
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} ${status} - ${message}`,
      errors.length ? errors : undefined,
      HttpExceptionFilter.name,
    );

    // Send formatted error response
    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errors.length ? { errors } : {}),
    };

    response.status(status).json(responseBody);
  }
}
