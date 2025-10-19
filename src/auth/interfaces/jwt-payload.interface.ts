export interface JwtPayload {
  id: number;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}
