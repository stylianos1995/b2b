import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RequestContext } from "../../common/interfaces/request-context.interface";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as RequestContext;
  },
);
