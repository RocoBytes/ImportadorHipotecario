export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  frontendUrl: string;
}
