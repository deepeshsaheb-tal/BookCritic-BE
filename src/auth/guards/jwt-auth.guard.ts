import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

/**
 * Guard for JWT authentication
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Determines if the request is allowed to proceed
   * @param context - Execution context
   * @returns Boolean indicating if the request can proceed
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Get the request object
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    console.log('Auth header:', authHeader);
    
    // More detailed debugging
    console.log('Request path:', request.path);
    console.log('All headers:', JSON.stringify(request.headers));
    
    if (!authHeader) {
      console.log('No Authorization header found');
    } else if (!authHeader.startsWith('Bearer ')) {
      console.log('Authorization header does not start with Bearer');
    } else {
      console.log('Bearer token found with length:', authHeader.substring(7).length);
    }
    
    return super.canActivate(context);
  }

  /**
   * Handles unauthorized errors
   * @param err - Error object
   */
  handleRequest(err: any, user: any): any {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
