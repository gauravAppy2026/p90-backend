import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SubscriptionsService } from '../../modules/subscriptions/subscriptions.service';

// Gates 30-day program content behind an active purchase. Apply AFTER
// `JwtAuthGuard` so `request.user` is populated. Admins always pass.
@Injectable()
export class ActivePurchaseGuard implements CanActivate {
  constructor(private subscriptions: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    if (!user?._id) throw new UnauthorizedException();

    // Admins bypass the paywall — they need to be able to QA paid content.
    if (user.role === 'admin') return true;

    const ok = await this.subscriptions.hasActiveProgramAccess(String(user._id));
    if (!ok) {
      throw new ForbiddenException('Unlock the 30-Day Recharge to access this content.');
    }
    return true;
  }
}
