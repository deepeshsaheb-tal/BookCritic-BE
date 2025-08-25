import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsISBN, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * DTO for creating a new book
 */
export class CreateBookDto {
  @ApiProperty({
    description: 'Book title',
    example: 'The Great Gatsby',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  readonly title: string;

  @ApiProperty({
    description: 'Book author',
    example: 'F. Scott Fitzgerald',
  })
  @IsString({ message: 'Author must be a string' })
  @IsNotEmpty({ message: 'Author is required' })
  readonly author: string;

  @ApiProperty({
    description: 'Book ISBN (International Standard Book Number)',
    example: '9780743273565',
    required: false,
  })
  @IsISBN(undefined, { message: 'ISBN must be a valid ISBN number' })
  @IsOptional()
  readonly isbn?: string;

  @ApiProperty({
    description: 'Book description',
    example: 'The Great Gatsby is a 1925 novel by American writer F. Scott Fitzgerald...',
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  readonly description?: string;

  @ApiProperty({
    description: 'Book publication date (YYYY-MM-DD)',
    example: '1925-04-10',
    required: false,
  })
  @IsDateString({}, { message: 'Published date must be a valid date string (YYYY-MM-DD)' })
  @IsOptional()
  readonly publishedDate?: string;

  @ApiProperty({
    description: 'URL to book cover image',
    example: 'https://example.com/covers/great-gatsby.jpg',
    required: false,
  })
  @IsString({ message: 'Cover image URL must be a string' })
  @IsOptional()
  readonly coverImageUrl?: string;

  @ApiProperty({
    description: 'Array of genre IDs for the book',
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
    required: false,
    type: [String],
  })
  @IsArray({ message: 'Genre IDs must be an array' })
  @IsUUID('4', { each: true, message: 'Each genre ID must be a valid UUID' })
  @IsOptional()
  readonly genreIds?: string[];
}
