import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationRule } from './schemas/gamification-rule.schema';
import { RedemptionOption } from './schemas/redemption-option.schema';
import { Redemption } from './schemas/redemption.schema';
import { TokenLedger } from './schemas/token-ledger.schema';
import { UserProgress } from '../program/schemas/user-progress.schema';
import { User } from '../users/schemas/user.schema';

describe('GamificationService', () => {
  let service: GamificationService;
  let rules: any;
  let options: any;
  let redemptions: any;
  let ledger: any;
  let progress: any;
  let users: any;
  let config: any;

  beforeEach(async () => {
    rules = {
      countDocuments: jest.fn().mockResolvedValue(8), // skip seeding
      insertMany: jest.fn(),
      find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };
    options = {
      countDocuments: jest.fn().mockResolvedValue(4),
      insertMany: jest.fn(),
      find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
    };
    redemptions = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([]),
        }),
      }),
    };
    ledger = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
      }),
    };
    progress = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      updateOne: jest.fn(),
    };
    users = {
      findById: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(null) }),
    };
    config = { get: jest.fn().mockReturnValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: getModelToken(GamificationRule.name), useValue: rules },
        { provide: getModelToken(RedemptionOption.name), useValue: options },
        { provide: getModelToken(Redemption.name), useValue: redemptions },
        { provide: getModelToken(TokenLedger.name), useValue: ledger },
        { provide: getModelToken(UserProgress.name), useValue: progress },
        { provide: getModelToken(User.name), useValue: users },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(GamificationService);
  });

  it('seeds defaults when both collections are empty', async () => {
    rules.countDocuments.mockResolvedValue(0);
    options.countDocuments.mockResolvedValue(0);
    await service.onModuleInit();
    expect(rules.insertMany).toHaveBeenCalled();
    expect(options.insertMany).toHaveBeenCalled();
  });

  it('does not seed when collections already have data', async () => {
    rules.countDocuments.mockResolvedValue(8);
    options.countDocuments.mockResolvedValue(4);
    await service.onModuleInit();
    expect(rules.insertMany).not.toHaveBeenCalled();
    expect(options.insertMany).not.toHaveBeenCalled();
  });

  it('awards tokens for a known rule', async () => {
    rules.findOne.mockResolvedValue({ tokens: 10, isActive: true });
    progress.findOneAndUpdate.mockResolvedValue({ tokenBalance: 10 });
    progress.findOne.mockResolvedValue({ tokenBalance: 10 });
    ledger.findOne.mockResolvedValue(null);
    ledger.create.mockResolvedValue({});

    const r = await service.award({
      userId: '507f1f77bcf86cd799439011',
      key: 'lesson_complete',
      referenceId: 'day-1',
    });
    expect(r.awarded).toBe(10);
    expect(r.balance).toBe(10);
    expect(ledger.create).toHaveBeenCalledWith(
      expect.objectContaining({ delta: 10, reason: 'lesson_complete', referenceId: 'day-1' }),
    );
  });

  it('does not double-award for the same referenceId', async () => {
    rules.findOne.mockResolvedValue({ tokens: 10, isActive: true });
    progress.findOne.mockResolvedValue({ tokenBalance: 10 });
    ledger.findOne.mockResolvedValue({ _id: 'existing' });

    const r = await service.award({
      userId: '507f1f77bcf86cd799439011',
      key: 'lesson_complete',
      referenceId: 'day-1',
    });
    expect(r.awarded).toBe(0);
    expect(ledger.create).not.toHaveBeenCalled();
    expect(progress.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('redeems when balance is sufficient', async () => {
    options.findById.mockResolvedValue({
      _id: 'opt1',
      title: 'Donate $10',
      tokenCost: 500,
      isActive: true,
    });
    progress.findOne.mockResolvedValue({ tokenBalance: 600 });
    progress.findOneAndUpdate.mockResolvedValue({ tokenBalance: 100 });
    redemptions.create.mockResolvedValue({ _id: 'r1' });
    ledger.create.mockResolvedValue({});

    const r = await service.redeem({ userId: '507f1f77bcf86cd799439011', optionId: 'opt1' });
    expect(r.balance).toBe(100);
    expect(redemptions.create).toHaveBeenCalledWith(
      expect.objectContaining({ tokensSpent: 500, status: 'pending' }),
    );
  });

  it('rejects redemption when balance insufficient', async () => {
    options.findById.mockResolvedValue({ tokenCost: 500, isActive: true });
    progress.findOne.mockResolvedValue({ tokenBalance: 100 });

    await expect(
      service.redeem({ userId: '507f1f77bcf86cd799439011', optionId: 'opt1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects redemption against unknown option', async () => {
    options.findById.mockResolvedValue(null);
    await expect(
      service.redeem({ userId: '507f1f77bcf86cd799439011', optionId: 'bad' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('refunds tokens on cancelled redemption', async () => {
    const r: any = {
      _id: 'r1',
      userId: '507f1f77bcf86cd799439011',
      status: 'pending',
      tokensSpent: 500,
      save: jest.fn().mockResolvedValue(undefined),
    };
    redemptions.findById.mockResolvedValue(r);
    progress.findOneAndUpdate.mockResolvedValue({ tokenBalance: 600 });
    ledger.create.mockResolvedValue({});

    await service.fulfillRedemption({
      id: 'r1',
      adminId: '507f1f77bcf86cd799439011',
      status: 'cancelled',
    });

    expect(r.status).toBe('cancelled');
    expect(ledger.create).toHaveBeenCalledWith(
      expect.objectContaining({ delta: 500, reason: expect.stringContaining('refund:') }),
    );
  });
});
