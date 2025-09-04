import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Book } from '../../books/entities/book.entity';

/**
 * Review entity representing user reviews for books
 */
@Entity('reviews')
export class Review extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'book_id' })
  bookId: string;

  @Column({ type: 'integer' })
  rating: number;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Book, (book) => book.reviews, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'book_id' })
  book: Book;
}
