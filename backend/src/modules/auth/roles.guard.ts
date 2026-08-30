import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role, ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private jwtService: JwtService) {}

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    
    // Attempt to extract and verify token
    const token = this.extractTokenFromHeader(request);
    if (token) {
      try {
        const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
        request.user = payload; // Attach to request
      } catch (err) {
        // Token invalid or expired, continue without user
      }
    }

    if (!requiredRoles) {
      return true; // No roles required, allow access
    }
    
    const { user } = request;
    
    // Fail closed: if there is no user attached to the request or no role is present, deny access.
    if (!user || !user.role) {
      return false;
    }
    return requiredRoles.includes(user.role);
  }
}
