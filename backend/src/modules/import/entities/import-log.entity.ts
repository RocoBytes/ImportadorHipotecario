import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('import_logs')
export class ImportLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'admin_id', type: 'uuid' })
  adminId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @Column({ name: 'filas_totales', type: 'integer', default: 0 })
  filasTotales: number;

  @Column({ name: 'filas_insertadas', type: 'integer', default: 0 })
  filasInsertadas: number;

  @Column({ name: 'errores', type: 'jsonb', nullable: true })
  errores: Record<string, any>;

  @Column({ name: 'archivo_nombre', length: 255, nullable: true })
  archivoNombre: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
