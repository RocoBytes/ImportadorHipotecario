import { UserRole } from '../../users/entities/user.entity';

export class LoginResponseDto {
  accessToken: string;
  mustChangePassword: boolean;
  user: {
    id: string;
    rut: string;
    rol: UserRole;
  };
}
