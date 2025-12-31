import api from './api';

export interface User {
  id: string;
  rut: string;
  rol: 'ADMIN' | 'VENDEDOR';
  mustChangePassword?: boolean;
}

export interface LoginCredentials {
  rut: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  mustChangePassword: boolean;
  user: User;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Servicio de autenticación
 */
class AuthService {
  /**
   * Login de usuario
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  }

  /**
   * Obtener perfil del usuario actual
   */
  async getProfile(): Promise<User> {
    const response = await api.post<User>('/api/auth/profile');
    return response.data;
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/auth/change-password', data);
    return response.data;
  }
}

export default new AuthService();
