import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Timezone = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-timezone'] || undefined;
  },
);
