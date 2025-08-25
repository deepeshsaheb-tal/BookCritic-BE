import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard for local authentication strategy
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
