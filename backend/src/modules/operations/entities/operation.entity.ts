import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('operations')
export class Operation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'id_mutuo', length: 50, nullable: true })
  idMutuo: string;

  @Column({ name: 'estado_mutuo', length: 100, nullable: true })
  estadoMutuo: string;

  @Column({ name: 'fecha_escritura', type: 'date', nullable: true })
  fechaEscritura: Date;

  @Column({ name: 'valor_venta', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorVenta: number;

  @Column({ name: 'rut_cliente', length: 12, nullable: true })
  rutCliente: string;

  @Column({ name: 'nombre_cliente', length: 255, nullable: true })
  nombreCliente: string;

  @Column({ name: 'detalles_extra', type: 'jsonb', nullable: true })
  detallesExtra: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
