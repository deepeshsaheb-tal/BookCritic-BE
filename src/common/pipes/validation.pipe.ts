import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

/**
 * Global validation pipe for request data validation
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(ValidationPipe.name);

  /**
   * Transform and validate incoming data
   * @param value - The value to transform and validate
   * @param metadata - Metadata about the value
   * @returns Transformed and validated value
   * @throws BadRequestException if validation fails
   */
  async transform(value: any, { metatype }: ArgumentMetadata): Promise<any> {
    // If no metatype or not a class, skip validation
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Transform plain object to class instance
    const object = plainToClass(metatype, value);
    
    // Validate the object
    const errors = await validate(object);
    
    if (errors.length > 0) {
      // Format validation errors
      const formattedErrors = errors.map(err => {
        const constraints = err.constraints ? Object.values(err.constraints) : ['Invalid value'];
        return {
          property: err.property,
          value: err.value,
          constraints: constraints,
        };
      });
      
      this.logger.warn(`Validation failed: ${JSON.stringify(formattedErrors)}`);
      
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }
    
    return object;
  }

  /**
   * Check if the metatype should be validated
   * @param metatype - The metatype to check
   * @returns Boolean indicating if the metatype should be validated
   */
  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
