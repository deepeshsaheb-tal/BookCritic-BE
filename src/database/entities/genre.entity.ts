import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Genre entity representing book genres
 */
@Entity('genres')
export class Genre extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;
}
