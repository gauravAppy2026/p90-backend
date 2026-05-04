import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ActivePurchaseGuard } from './active-purchase.guard';

describe('ActivePurchaseGuard', () => {
  let guard: ActivePurchaseGuard;
  let subscriptions: { hasActiveProgramAccess: jest.Mock };

  const ctx = (user: any): any => ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  });

  beforeEach(() => {
    subscriptions = { hasActiveProgramAccess: jest.fn() };
    guard = new ActivePurchaseGuard(subscriptions as any);
  });

  it('throws Unauthorized when no user on the request', async () => {
    await expect(guard.canActivate(ctx(undefined))).rejects.toThrow(UnauthorizedException);
  });

  it('lets admins through without checking purchases', async () => {
    const result = await guard.canActivate(ctx({ _id: 'a1', role: 'admin' }));
    expect(result).toBe(true);
    expect(subscriptions.hasActiveProgramAccess).not.toHaveBeenCalled();
  });

  it('returns true when the user has an active purchase', async () => {
    subscriptions.hasActiveProgramAccess.mockResolvedValue(true);
    const result = await guard.canActivate(ctx({ _id: 'u1', role: 'user' }));
    expect(result).toBe(true);
    expect(subscriptions.hasActiveProgramAccess).toHaveBeenCalledWith('u1');
  });

  it('throws Forbidden when the user has no active purchase', async () => {
    subscriptions.hasActiveProgramAccess.mockResolvedValue(false);
    await expect(guard.canActivate(ctx({ _id: 'u2', role: 'user' }))).rejects.toThrow(ForbiddenException);
  });
});
