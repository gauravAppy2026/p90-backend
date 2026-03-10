import { Test, TestingModule } from '@nestjs/testing';
import { TrackerService } from './tracker.service';
import { getModelToken } from '@nestjs/mongoose';
import { DailyTracker } from './schemas/daily-tracker.schema';
import { TrackerCategory } from './schemas/tracker-category.schema';
import { Types } from 'mongoose';

const userId = new Types.ObjectId().toString();

describe('TrackerService', () => {
  let service: TrackerService;
  let trackerModel: any;
  let categoryModel: any;

  beforeEach(async () => {
    trackerModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
      }),
    };
    categoryModel = {
      find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackerService,
        { provide: getModelToken(DailyTracker.name), useValue: trackerModel },
        { provide: getModelToken(TrackerCategory.name), useValue: categoryModel },
      ],
    }).compile();

    service = module.get<TrackerService>(TrackerService);
  });

  it('should get today tracker', async () => {
    trackerModel.findOne.mockResolvedValue({ energyLevel: 7 });
    const result = await service.getToday(userId);
    expect(result?.energyLevel).toBe(7);
  });

  it('should upsert today tracker', async () => {
    trackerModel.findOneAndUpdate.mockResolvedValue({ energyLevel: 8 });
    const result = await service.updateToday(userId, { energyLevel: 8, dayNumber: 1 } as any);
    expect(result.energyLevel).toBe(8);
  });

  it('should get active categories only', async () => {
    const mockSort = jest.fn().mockResolvedValue([{ name: 'Mood', isActive: true }]);
    categoryModel.find.mockReturnValue({ sort: mockSort });
    const result = await service.getActiveCategories();
    expect(categoryModel.find).toHaveBeenCalledWith({ isActive: true });
  });

  it('should create a category', async () => {
    categoryModel.create.mockResolvedValue({ name: 'Energy', isActive: true });
    const result = await service.createCategory({ name: 'Energy' });
    expect(result.name).toBe('Energy');
  });

  it('should update a category', async () => {
    categoryModel.findByIdAndUpdate.mockResolvedValue({ name: 'Updated' });
    const result = await service.updateCategory('cat-id', { name: 'Updated' });
    expect(result?.name).toBe('Updated');
  });

  it('should delete a category', async () => {
    categoryModel.findByIdAndDelete.mockResolvedValue({});
    await service.deleteCategory('cat-id');
    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith('cat-id');
  });

  it('should get history', async () => {
    const mockLimit = jest.fn().mockResolvedValue([{ date: '2025-01-01' }]);
    const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
    trackerModel.find.mockReturnValue({ sort: mockSort });
    await service.getHistory(userId, 14);
    expect(mockLimit).toHaveBeenCalledWith(14);
  });
});
