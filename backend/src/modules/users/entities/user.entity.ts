import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  VENDEDOR = 'VENDEDOR',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 12 })
  rut: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'must_change_password', default: true })
  mustChangePassword: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  rol: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
