import { Injectable, ExecutionContext } from "@nestjs/common";
import { RequestContext } from "../../common/interfaces/request-context.interface";

/**
 * Resolve the current principal (user + memberships) from the request.
 * Use after JwtAuthGuard has run; request.user is set by JwtStrategy.
 */
@Injectable()
export class PrincipalResolver {
  getPrincipal(context: ExecutionContext): RequestContext | undefined {
    const request = context.switchToHttp().getRequest();
    return request.user as RequestContext | undefined;
  }
}
