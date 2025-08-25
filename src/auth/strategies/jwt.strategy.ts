import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

/**
 * JWT payload interface
 */
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * JWT authentication strategy
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default_secret_change_in_production',
    });
  }

  /**
   * Validate JWT payload and return user
   * @param payload - JWT payload
   * @returns User object
   */
  async validate(payload: JwtPayload): Promise<any> {
    const user = await this.usersService.findOne(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    return {
      id: user.id,
      email: user.email,
      role: payload.role || 'user', // Default to 'user' if no role specified
    };
  }
}
