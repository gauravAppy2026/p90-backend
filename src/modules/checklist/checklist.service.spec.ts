import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistService } from './checklist.service';
import { getModelToken } from '@nestjs/mongoose';
import { DailyChecklist } from './schemas/daily-checklist.schema';
import { ChecklistConfig } from './schemas/checklist-config.schema';
import { Types } from 'mongoose';

const userId = new Types.ObjectId().toString();

describe('ChecklistService', () => {
  let service: ChecklistService;
  let model: any;

  beforeEach(async () => {
    model = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistService,
        { provide: getModelToken(DailyChecklist.name), useValue: model },
        { provide: getModelToken(ChecklistConfig.name), useValue: { find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }) } },
      ],
    }).compile();

    service = module.get<ChecklistService>(ChecklistService);
  });

  it('should get today checklist', async () => {
    model.findOne.mockResolvedValue({ date: '2025-01-01', items: {} });
    const result = await service.getToday(userId);
    expect(result).toBeDefined();
  });

  it('should return null if no checklist today', async () => {
    model.findOne.mockResolvedValue(null);
    const result = await service.getToday(userId);
    expect(result).toBeNull();
  });

  it('should upsert today checklist with completionCount', async () => {
    const items = { p90Session: true, morningSmoothie: true, waterIntake: false };
    model.findOneAndUpdate.mockResolvedValue({ items, completionCount: 2 });
    const result = await service.updateToday(userId, { items, dayNumber: 1 });
    expect(model.findOneAndUpdate).toHaveBeenCalled();
  });

  it('should get history with limit', async () => {
    const mockSort = { limit: jest.fn().mockResolvedValue([{ date: '2025-01-01' }]) };
    model.find.mockReturnValue({ sort: jest.fn().mockReturnValue(mockSort) });
    const result = await service.getHistory(userId, 7);
    expect(mockSort.limit).toHaveBeenCalledWith(7);
  });
});
