import { UserRole } from '../../users/entities/user.entity';

export interface JwtPayload {
  sub: string; // User ID
  rut: string;
  rol: UserRole;
}
