export interface JwtPayload {
  sub: number; // Maps to user.id
  username: string;
  email: string;
  iat?: number; // Optional: issued at
  exp?: number; // Optional: expiration
}
