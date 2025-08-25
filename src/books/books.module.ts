import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { Book } from './entities/book.entity';
import { BookGenre } from './entities/book-genre.entity';

/**
 * Module for book-related functionality
 */
@Module({
  imports: [TypeOrmModule.forFeature([Book, BookGenre])],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
