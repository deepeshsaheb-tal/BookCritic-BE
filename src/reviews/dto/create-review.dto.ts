import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, Max, Min } from 'class-validator';

/**
 * DTO for creating a new book review
 */
export class CreateReviewDto {
  @ApiProperty({
    description: 'ID of the book being reviewed',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty({ message: 'Book ID is required' })
  readonly bookId: string;

  @ApiProperty({
    description: 'Rating from 1 to 5 stars',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot be more than 5' })
  @IsNotEmpty({ message: 'Rating is required' })
  readonly rating: number;

  @ApiProperty({
    description: 'Review content/text',
    example: 'This book was a fantastic read with compelling characters and an engaging plot.',
  })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  readonly content: string;
}
