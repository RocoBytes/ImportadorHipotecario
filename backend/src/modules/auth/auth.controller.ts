import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/login
   * Autentica un usuario y devuelve JWT
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * POST /api/auth/change-password
   * Cambia la contraseña del usuario autenticado
   * Requiere JWT válido
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @GetUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  /**
   * POST /api/auth/profile
   * Obtiene el perfil del usuario autenticado
   * Requiere JWT válido
   */
  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@GetUser() user: User) {
    return {
      id: user.id,
      rut: user.rut,
      rol: user.rol,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
