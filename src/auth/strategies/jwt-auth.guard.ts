import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );
    if (isPublic) {
      return true; // Bypass authentication for public endpoints
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload: JwtPayload = this.jwtService.verify(token);
      // Verificar se o payload tem os campos corretos
      if (!payload?.id || !payload?.username) {
        throw new UnauthorizedException('Invalid token structure');
      }
      request.user = payload;
      return true;
    } catch (error) {
      console.error('JWT verification failed:', error); // Log adicional para ajudar no diagnóstico
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
