import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { User } from '../users/schemas/user.schema';
import { UserProgress } from '../program/schemas/user-progress.schema';
import { DailyTracker } from '../tracker/schemas/daily-tracker.schema';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

const userFound = (u: any) => ({ select: jest.fn().mockResolvedValue(u) });

describe('ParticipantsService outreach', () => {
  let service: ParticipantsService;
  let users: any;
  let subscriptions: any;

  beforeEach(async () => {
    users = { findById: jest.fn(), find: jest.fn() };
    subscriptions = { generateCodes: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantsService,
        { provide: getModelToken(User.name), useValue: users },
        { provide: getModelToken(UserProgress.name), useValue: {} },
        { provide: getModelToken(DailyTracker.name), useValue: {} },
        // No BREVO key configured → email send is a no-op returning false.
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
        { provide: SubscriptionsService, useValue: subscriptions },
      ],
    }).compile();

    service = module.get(ParticipantsService);
  });

  it('sendNudge throws when the participant does not exist', async () => {
    users.findById.mockReturnValue(userFound(null));
    await expect(service.sendNudge('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
  });

  it('sendNudge resolves (sent:false without a mail key) for a real participant', async () => {
    users.findById.mockReturnValue(userFound({ name: 'Jane Doe', email: 'jane@example.com' }));
    const res = await service.sendNudge('507f1f77bcf86cd799439011');
    expect(res).toEqual({ sent: false });
  });

  it('inviteToFreeAccess throws when the participant does not exist', async () => {
    users.findById.mockReturnValue(userFound(null));
    await expect(
      service.inviteToFreeAccess('admin1', '507f1f77bcf86cd799439011'),
    ).rejects.toThrow(NotFoundException);
  });

  it('inviteToFreeAccess mints a code for the participant and returns it', async () => {
    users.findById.mockReturnValue(userFound({ name: 'Jane Doe', email: 'jane@example.com' }));
    subscriptions.generateCodes.mockResolvedValue([{ code: 'ABC123' }]);

    const res = await service.inviteToFreeAccess('admin1', 'user1', 'all-in');

    expect(subscriptions.generateCodes).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 1,
        createdBy: 'admin1',
        product: 'all-in',
        notes: expect.stringContaining('jane@example.com'),
      }),
    );
    expect(res.code).toBe('ABC123');
    expect(res.sent).toBe(false);
  });

  it('inviteToFreeAccess defaults to the 30-day-recharge product', async () => {
    users.findById.mockReturnValue(userFound({ name: 'Jane', email: 'jane@example.com' }));
    subscriptions.generateCodes.mockResolvedValue([{ code: 'XYZ789' }]);

    await service.inviteToFreeAccess('admin1', 'user1');

    expect(subscriptions.generateCodes).toHaveBeenCalledWith(
      expect.objectContaining({ product: '30-day-recharge' }),
    );
  });
});
