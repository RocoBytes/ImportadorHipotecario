import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { normalizeRut, isValidRutFormat } from '../../common/utils/rut.utils';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Autentica un usuario y devuelve un JWT
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { rut, password } = loginDto;

    // Normalizar RUT (quitar puntos, dejar solo guion)
    const normalizedRut = normalizeRut(rut);

    // Validar formato de RUT
    if (!isValidRutFormat(normalizedRut)) {
      throw new BadRequestException(
        'Formato de RUT inválido. Debe ser: 12345678-9',
      );
    }

    // Buscar usuario por RUT
    const user = await this.userRepository.findOne({
      where: { rut: normalizedRut },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar JWT
    const payload: JwtPayload = {
      sub: user.id,
      rut: user.rut,
      rol: user.rol,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        rut: user.rut,
        rol: user.rol,
      },
    };
  }

  /**
   * Cambia la contraseña del usuario autenticado
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Buscar usuario
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    // Validar que la nueva contraseña sea diferente
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la actual',
      );
    }

    // Hashear nueva contraseña
    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    const newPasswordHash = await bcrypt.hash(newPassword, bcryptRounds);

    // Actualizar usuario
    user.passwordHash = newPasswordHash;
    user.mustChangePassword = false;

    await this.userRepository.save(user);

    return {
      message: 'Contraseña cambiada exitosamente',
    };
  }

  /**
   * Valida un usuario por su ID (usado por JWT Strategy)
   */
  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }
}
