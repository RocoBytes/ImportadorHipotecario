import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/login
   * Autentica un usuario y devuelve JWT
   * Rate limit estricto: 5 intentos por minuto
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ 
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario con RUT y contraseña, devuelve token JWT y datos del usuario'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login exitoso',
    type: LoginResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Credenciales inválidas' 
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Demasiados intentos de login (máx 5 por minuto)' 
  })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Cambiar contraseña',
    description: 'Permite al usuario autenticado cambiar su contraseña. Requiere la contraseña actual y la nueva contraseña.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Contraseña cambiada exitosamente' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autenticado o contraseña actual incorrecta' 
  })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Obtener perfil',
    description: 'Devuelve información del usuario autenticado'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil obtenido exitosamente' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autenticado' 
  })
  async getProfile(@GetUser() user: User) {
    return {
      id: user.id,
      rut: user.rut,
      rol: user.rol,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
