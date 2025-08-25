import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Book } from '../../books/entities/book.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Entity representing a user's favorite book
 */
@Entity('user_favorites')
export class UserFavorite {
  @PrimaryColumn('uuid')
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @PrimaryColumn('uuid')
  @ApiProperty({ description: 'Book ID' })
  bookId: string;

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Book, (book) => book.favoritedBy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;
}
