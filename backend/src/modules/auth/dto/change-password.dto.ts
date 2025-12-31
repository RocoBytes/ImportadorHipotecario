import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @MinLength(4, { message: 'La nueva contraseña debe tener al menos 4 caracteres' })
  newPassword: string;
}
