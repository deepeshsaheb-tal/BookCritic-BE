import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO for user registration
 */
export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  readonly email: string;

  @ApiProperty({
    description: 'User password',
    example: 'StrongP@ssw0rd',
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  readonly password: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
  })
  @IsString({ message: 'Display name must be a string' })
  @IsNotEmpty({ message: 'Display name is required' })
  readonly displayName: string;
}
