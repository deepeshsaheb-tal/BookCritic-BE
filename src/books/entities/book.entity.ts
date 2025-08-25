import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Review } from '../../reviews/entities/review.entity';
import { BookGenre } from './book-genre.entity';

/**
 * Book entity representing books in the system
 */
@Entity('books')
export class Book extends BaseEntity {
  @Column()
  title: string;

  @Column()
  author: string;

  @Column({ nullable: true, unique: true })
  isbn: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'published_date', nullable: true, type: 'date' })
  publishedDate: Date;

  @Column({ name: 'cover_image_url', nullable: true })
  coverImageUrl: string;

  @OneToMany(() => Review, (review) => review.book)
  reviews: Review[];

  @OneToMany(() => BookGenre, (bookGenre) => bookGenre.book)
  bookGenres: BookGenre[];
}
