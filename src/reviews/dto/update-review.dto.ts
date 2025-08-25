import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * DTO for updating a book review
 */
export class UpdateReviewDto {
  @ApiProperty({
    description: 'Rating from 1 to 5 stars',
    example: 4,
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot be more than 5' })
  @IsOptional()
  readonly rating?: number;

  @ApiProperty({
    description: 'Review content/text',
    example: 'This book was a fantastic read with compelling characters and an engaging plot.',
    required: false,
  })
  @IsString({ message: 'Content must be a string' })
  @IsOptional()
  readonly content?: string;
}
