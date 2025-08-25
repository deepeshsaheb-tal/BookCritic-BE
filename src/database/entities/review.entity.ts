import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Book } from './book.entity';

/**
 * Review entity representing book reviews
 */
@Entity('reviews')
export class Review extends BaseEntity {
  @Column()
  rating: number;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne('User', 'reviews', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne('Book', 'reviews', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @Column({ name: 'book_id' })
  bookId: string;
}
