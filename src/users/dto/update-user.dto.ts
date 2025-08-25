import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * DTO for updating user information
 */
export class UpdateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: false,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  readonly email?: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
    required: false,
  })
  @IsString({ message: 'Display name must be a string' })
  @IsOptional()
  readonly displayName?: string;

  @ApiProperty({
    description: 'User password (min 8 characters)',
    example: 'NewPassword123!',
    required: false,
  })
  @IsString({ message: 'Password must be a string' })
  @IsOptional()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  readonly password?: string;
}
