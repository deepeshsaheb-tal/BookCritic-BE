import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

/**
 * Custom Winston logger service for structured logging
 */
@Injectable()
export class WinstonLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor(private readonly configService: ConfigService) {
    const environment = this.configService.get<string>('NODE_ENV') || 'development';
    const isProduction = environment === 'production';

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );

    // Define transports
    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            return `${timestamp} [${level}] [${context || 'Application'}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ''
            }`;
          }),
        ),
      }),
    ];

    // Add file transport in production
    if (isProduction) {
      // Daily rotate file transport for application logs
      transports.push(
        new winston.transports.DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: logFormat,
        }),
      );

      // Separate file for error logs
      transports.push(
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
          format: logFormat,
        }),
      );
    }

    // Create logger instance
    this.logger = winston.createLogger({
      level: isProduction ? 'info' : 'debug',
      format: logFormat,
      defaultMeta: { service: 'bookcritic-api' },
      transports,
    });
  }

  /**
   * Log a message at the 'log' level
   * @param message - Message to log
   * @param context - Optional context for the log
   */
  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  /**
   * Log a message at the 'error' level
   * @param message - Message to log
   * @param trace - Optional stack trace
   * @param context - Optional context for the log
   */
  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  /**
   * Log a message at the 'warn' level
   * @param message - Message to log
   * @param context - Optional context for the log
   */
  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  /**
   * Log a message at the 'debug' level
   * @param message - Message to log
   * @param context - Optional context for the log
   */
  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  /**
   * Log a message at the 'verbose' level
   * @param message - Message to log
   * @param context - Optional context for the log
   */
  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }
}
