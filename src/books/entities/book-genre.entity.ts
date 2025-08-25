import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Book } from './book.entity';
import { Genre } from '../../genres/entities/genre.entity';

/**
 * Junction entity for many-to-many relationship between books and genres
 */
@Entity('book_genres')
export class BookGenre {
  @PrimaryColumn({ name: 'book_id' })
  bookId: string;

  @PrimaryColumn({ name: 'genre_id' })
  genreId: string;

  @ManyToOne(() => Book, (book) => book.bookGenres)
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @ManyToOne(() => Genre, (genre) => genre.bookGenres)
  @JoinColumn({ name: 'genre_id' })
  genre: Genre;
}
