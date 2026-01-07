import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Constantes para roles (evita problemas con enum en Node.js)
export const UserRole = {
  ADMIN: 'ADMIN',
  VENDEDOR: 'VENDEDOR',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

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
    enum: ['ADMIN', 'VENDEDOR'],
  })
  rol: UserRoleType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
