import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Exclude } from 'class-transformer';

/**
 * User entity representing application users
 */
@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ name: 'password_hash' })
  @Exclude()
  passwordHash: string;

  @Column({ name: 'last_login', nullable: true })
  lastLogin: Date;

  @Column({ default: 'user' })
  role: string;

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];
}
