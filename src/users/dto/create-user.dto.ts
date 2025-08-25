import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a new user
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  readonly email: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
  })
  @IsString({ message: 'Display name must be a string' })
  @IsNotEmpty({ message: 'Display name is required' })
  readonly displayName: string;

  @ApiProperty({
    description: 'User password (min 8 characters)',
    example: 'Password123!',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  readonly password: string;
}
