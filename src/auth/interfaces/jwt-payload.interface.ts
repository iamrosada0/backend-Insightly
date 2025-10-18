export interface JwtPayload {
  id: number; // Maps to user.id
  username: string;
  email: string;
  iat?: number; // Optional: issued at
  exp?: number; // Optional: expiration
}
