import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'El RUT es requerido' })
  rut: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}
