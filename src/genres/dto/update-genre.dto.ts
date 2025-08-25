import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for updating a genre
 */
export class UpdateGenreDto {
  @ApiProperty({
    description: 'Genre name',
    example: 'Science Fiction',
    required: false,
  })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  readonly name?: string;

  @ApiProperty({
    description: 'Genre description',
    example: 'Science fiction is a genre of speculative fiction that typically deals with imaginative and futuristic concepts.',
    required: false,
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  readonly description?: string;
}
