import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { PurchaseRecord } from './schemas/purchase-record.schema';
import { UnlockCode } from './schemas/unlock-code.schema';
import { MonthCycle } from './schemas/month-cycle.schema';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let purchases: any;
  let codes: any;
  let cycles: any;

  beforeEach(async () => {
    purchases = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
    };
    codes = {
      create: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };
    cycles = {
      create: jest.fn(),
      updateMany: jest.fn(),
      updateOne: jest.fn(),
      find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: getModelToken(PurchaseRecord.name), useValue: purchases },
        { provide: getModelToken(UnlockCode.name), useValue: codes },
        { provide: getModelToken(MonthCycle.name), useValue: cycles },
      ],
    }).compile();

    service = module.get(SubscriptionsService);
  });

  it('records a purchase', async () => {
    purchases.create.mockResolvedValue({ _id: 'p1' });
    const r = await service.recordPurchase({
      userId: '507f1f77bcf86cd799439011',
      product: '30-day-recharge',
      source: 'apple-iap',
      transactionId: 'tx1',
    });
    expect(r._id).toBe('p1');
    expect(purchases.create).toHaveBeenCalledWith(
      expect.objectContaining({ product: '30-day-recharge', source: 'apple-iap', status: 'active' }),
    );
  });

  it('detects an active purchase', async () => {
    purchases.findOne.mockResolvedValue({ _id: 'p1' });
    const r = await service.hasActivePurchase('507f1f77bcf86cd799439011', '30-day-recharge');
    expect(r).toBe(true);
  });

  it('generates the requested number of unique codes', async () => {
    codes.create.mockImplementation((doc: any) => Promise.resolve(doc));
    const result = await service.generateCodes({ count: 5, createdBy: '507f1f77bcf86cd799439011' });
    expect(result).toHaveLength(5);
    expect(result.every((c) => /^[A-Z0-9]{6}$/.test(c.code))).toBe(true);
    // No code should contain 0/O/1/I/L
    expect(result.every((c) => !/[01OIL]/.test(c.code))).toBe(true);
  });

  it('redeems an unused code', async () => {
    const codeDoc: any = {
      _id: 'c1',
      code: 'A4F7K2',
      product: 'all-in',
      status: 'unused',
      save: jest.fn().mockResolvedValue(undefined),
    };
    codes.findOne.mockResolvedValue(codeDoc);
    purchases.create.mockResolvedValue({ _id: 'p1' });

    const r = await service.redeemCode({ userId: '507f1f77bcf86cd799439011', code: 'a4f7k2' });
    expect(r.status).toBe('redeemed');
    expect(codeDoc.save).toHaveBeenCalled();
    expect(purchases.create).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'code-redemption', product: 'all-in' }),
    );
  });

  it('rejects a redeemed code', async () => {
    codes.findOne.mockResolvedValue({ status: 'redeemed' });
    await expect(
      service.redeemCode({ userId: '507f1f77bcf86cd799439011', code: 'XXXXXX' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a revoked code', async () => {
    codes.findOne.mockResolvedValue({ status: 'revoked' });
    await expect(
      service.redeemCode({ userId: '507f1f77bcf86cd799439011', code: 'XXXXXX' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects an expired code', async () => {
    codes.findOne.mockResolvedValue({
      status: 'unused',
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(
      service.redeemCode({ userId: '507f1f77bcf86cd799439011', code: 'XXXXXX' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects an unknown code', async () => {
    codes.findOne.mockResolvedValue(null);
    await expect(
      service.redeemCode({ userId: '507f1f77bcf86cd799439011', code: 'XXXXXX' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('starts a new month cycle and deactivates prior cycles', async () => {
    cycles.create.mockResolvedValue({ _id: 'mc1', monthNumber: 2 });
    await service.startNewCycle('507f1f77bcf86cd799439011', 2);
    expect(cycles.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true }),
      expect.objectContaining({ $set: { isActive: false } }),
    );
    expect(cycles.create).toHaveBeenCalledWith(
      expect.objectContaining({ monthNumber: 2, isActive: true }),
    );
  });
});
