import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
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
  @Exclude({ toPlainOnly: true })
  passwordHash: string;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date;

  @OneToMany(
    'Review',
    'user',
  )
  reviews: any[];
}
