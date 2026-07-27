import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  username?: string;
  role: string;
  organizationId?: string;
  branchId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secretKey = configService.get<string>('JWT_SECRET');
    if (!secretKey) {
      throw new Error('JWT_SECRET is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey,
    });
  }

  async validate(payload: JwtPayload) {
    const normalizedRole =
      typeof payload.role === 'string' ? payload.role.toLowerCase() : payload.role;

    return {
      id: payload.sub,
      _id: payload.sub,
      email: payload.email,
      username: payload.username,
      role: normalizedRole,
      organizationId: payload.organizationId,
      branchId: payload.branchId,
    };
  }
}
