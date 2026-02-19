import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RequestContext } from '../../common/interfaces/request-context.interface';

export const PROVIDER_ID_KEY = 'providerId';

@Injectable()
export class ProviderScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestContext | undefined;
    if (!user?.memberships?.length) {
      throw new ForbiddenException('No provider membership');
    }
    const providerMembership = user.memberships.find((m) => m.providerId);
    if (!providerMembership?.providerId) {
      throw new ForbiddenException('No provider scope');
    }
    request[PROVIDER_ID_KEY] = providerMembership.providerId;
    return true;
  }
}
