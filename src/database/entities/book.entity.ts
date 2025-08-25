import { Column, Entity, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from './base.entity';

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

  @OneToMany(
    'Review',
    'book',
  )
  reviews: any[];

  @ManyToMany(
    'Genre',
  )
  @JoinTable({
    name: 'book_genres',
    joinColumn: {
      name: 'book_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'genre_id',
      referencedColumnName: 'id',
    },
  })
  genres: any[];
}
