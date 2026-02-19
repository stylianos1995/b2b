import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RequestContext } from "../../common/interfaces/request-context.interface";
import { ROLES_KEY } from "../../common/decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) return true;
    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestContext | undefined;
    if (!user?.memberships?.length) {
      throw new ForbiddenException("No role membership");
    }
    const userRoles = user.memberships.map((m) => m.role);
    const hasRole = requiredRoles.some((r) => userRoles.includes(r));
    if (!hasRole) {
      throw new ForbiddenException("Insufficient role");
    }
    return true;
  }
}
