import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'RUT del usuario (formato: XXXXXXXX-X)',
    example: '76453723-8',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'El RUT es requerido' })
  rut: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: '76458',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}
