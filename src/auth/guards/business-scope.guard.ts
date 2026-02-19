import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { RequestContext } from "../../common/interfaces/request-context.interface";

export const BUSINESS_ID_KEY = "businessId";

@Injectable()
export class BusinessScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestContext | undefined;
    if (!user?.memberships?.length) {
      throw new ForbiddenException("No business membership");
    }
    const businessMembership = user.memberships.find((m) => m.businessId);
    if (!businessMembership?.businessId) {
      throw new ForbiddenException("No business scope");
    }
    request[BUSINESS_ID_KEY] = businessMembership.businessId;
    return true;
  }
}
