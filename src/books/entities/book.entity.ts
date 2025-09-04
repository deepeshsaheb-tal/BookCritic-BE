import { Column, Entity, OneToMany, AfterLoad } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Review } from '../../reviews/entities/review.entity';
import { BookGenre } from './book-genre.entity';
import { UserFavorite } from '../../favorites/entities/user-favorite.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Book entity representing books in the system
 */
@Entity('books')
export class Book extends BaseEntity {
  @Column()
  title: string;

  @Column()
  author: string;

  @Column({ unique: true })
  isbn: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'published_date', type: 'date' })
  publishedDate: Date;

  @Column({ name: 'cover_image_url', nullable: true })
  coverImageUrl: string;

  @OneToMany(() => Review, (review) => review.book)
  reviews: Review[];

  @OneToMany(() => BookGenre, (bookGenre) => bookGenre.book)
  bookGenres: BookGenre[];

  @OneToMany(() => UserFavorite, (userFavorite) => userFavorite.book)
  favoritedBy: UserFavorite[];
  
  /**
   * Average rating of the book (calculated from reviews)
   */
  @ApiProperty({ description: 'Average rating of the book (1-5)', type: Number })
  averageRating: number;
  
  /**
   * Total number of reviews for the book
   */
  @ApiProperty({ description: 'Total number of reviews for the book', type: Number })
  totalReviews: number;
  
  /**
   * Calculate average rating and total reviews after loading the entity
   */
  @AfterLoad()
  calculateAverageRating(): void {
    if (this.reviews && this.reviews.length > 0) {
      const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
      this.averageRating = parseFloat((sum / this.reviews.length).toFixed(1));
      this.totalReviews = this.reviews.length;
    } else {
      this.averageRating = 0;
      this.totalReviews = 0;
    }
  }
}
