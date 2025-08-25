import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { BookGenre } from '../../books/entities/book-genre.entity';

/**
 * Genre entity representing book categories
 */
@Entity('genres')
export class Genre extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => BookGenre, (bookGenre) => bookGenre.genre)
  bookGenres: BookGenre[];
}
