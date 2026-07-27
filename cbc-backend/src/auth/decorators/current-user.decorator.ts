import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  _id: string;
  email: string;
  username?: string;
  role: string;
  organizationId?: string;
  branchId?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as RequestUser;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
