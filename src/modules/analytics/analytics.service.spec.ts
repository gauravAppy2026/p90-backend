import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getModelToken } from '@nestjs/mongoose';
import { ClickEvent } from './schemas/click-event.schema';
import { UserProgress } from '../program/schemas/user-progress.schema';
import { User } from '../users/schemas/user.schema';
import { Types } from 'mongoose';

const userId = new Types.ObjectId().toString();

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let clickModel: any;
  let progressModel: any;
  let userModel: any;

  beforeEach(async () => {
    clickModel = {
      create: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue([]),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
      }),
    };
    progressModel = {
      aggregate: jest.fn().mockResolvedValue([]),
      find: jest.fn().mockResolvedValue([]),
    };
    userModel = {
      countDocuments: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue([]) }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getModelToken(ClickEvent.name), useValue: clickModel },
        { provide: getModelToken(UserProgress.name), useValue: progressModel },
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should track a click event', async () => {
    clickModel.create.mockResolvedValue({ eventType: 'product_click' });
    const result = await service.trackClick(userId, { eventType: 'product_click' });
    expect(result.eventType).toBe('product_click');
  });

  it('should get dashboard stats', async () => {
    userModel.countDocuments.mockResolvedValue(100);
    progressModel.aggregate.mockResolvedValue([{ avgCompletion: 45, totalStarted: 80 }]);
    const result = await service.getDashboardStats();
    expect(result.totalUsers).toBe(100);
  });

  it('should get completion rates', async () => {
    progressModel.aggregate.mockResolvedValue([{ _id: 5, count: 10 }]);
    const result = await service.getCompletionRates();
    expect(result).toHaveLength(1);
  });

  it('should get click stats', async () => {
    clickModel.aggregate.mockResolvedValue([{ _id: 'product_click', count: 50 }]);
    const result = await service.getClickStats();
    expect(result).toHaveLength(1);
  });

  it('should export analytics CSV', async () => {
    userModel.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: 'u1', name: 'User', email: 'u@t.com', createdAt: new Date() }]),
    });
    progressModel.find.mockResolvedValue([]);
    const result = await service.exportAnalyticsCsv();
    expect(result).toContain('Name,Email');
  });
});
