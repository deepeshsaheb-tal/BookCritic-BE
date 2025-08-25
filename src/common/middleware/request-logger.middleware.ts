import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware for logging HTTP requests and responses
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  /**
   * Process the request and log details
   * @param request - Express request object
   * @param response - Express response object
   * @param next - Next function
   */
  use(request: Request, response: Response, next: NextFunction): void {
    // Generate unique request ID
    const requestId = uuidv4();
    const { method, originalUrl, ip } = request;
    
    // Add request ID to request object for tracking
    request['requestId'] = requestId;
    
    // Log request start
    this.logger.log(
      `[${requestId}] ${method} ${originalUrl} - Started - IP: ${ip}`,
    );
    
    // Record start time
    const startTime = Date.now();
    
    // Add response listener to log when completed
    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length') || 0;
      const duration = Date.now() - startTime;
      
      // Log based on status code
      if (statusCode >= 500) {
        this.logger.error(
          `[${requestId}] ${method} ${originalUrl} ${statusCode} - ${duration}ms - ${contentLength} bytes`,
        );
      } else if (statusCode >= 400) {
        this.logger.warn(
          `[${requestId}] ${method} ${originalUrl} ${statusCode} - ${duration}ms - ${contentLength} bytes`,
        );
      } else {
        this.logger.log(
          `[${requestId}] ${method} ${originalUrl} ${statusCode} - ${duration}ms - ${contentLength} bytes`,
        );
      }
    });
    
    next();
  }
}
