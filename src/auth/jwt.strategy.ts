import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as JwtStrategyBase } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from 'src/users/users.service';

interface JwtPayload {
  userId: number;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(JwtStrategyBase, 'jwt') {
  constructor(private readonly usersService: UsersService) {
    const jwtExtractor = (
      ExtractJwt as {
        fromAuthHeaderAsBearerToken: () => (req: Request) => string | null;
      }
    ).fromAuthHeaderAsBearerToken();

    super({
      jwtFromRequest: jwtExtractor,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.userId);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
