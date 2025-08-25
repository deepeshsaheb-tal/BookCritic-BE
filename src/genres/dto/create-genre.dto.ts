import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating a new genre
 */
export class CreateGenreDto {
  @ApiProperty({
    description: 'Genre name',
    example: 'Science Fiction',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  readonly name: string;

  @ApiProperty({
    description: 'Genre description',
    example: 'Science fiction is a genre of speculative fiction that typically deals with imaginative and futuristic concepts.',
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  readonly description?: string;
}
