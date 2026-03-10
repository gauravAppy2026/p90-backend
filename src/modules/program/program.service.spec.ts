import { Test, TestingModule } from '@nestjs/testing';
import { ProgramService } from './program.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserProgress } from './schemas/user-progress.schema';
import { DayContent } from './schemas/day-content.schema';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

const userId = new Types.ObjectId().toString();

describe('ProgramService', () => {
  let service: ProgramService;
  let progressModel: any;
  let dayContentModel: any;

  beforeEach(async () => {
    progressModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    };
    dayContentModel = {
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramService,
        { provide: getModelToken(UserProgress.name), useValue: progressModel },
        { provide: getModelToken(DayContent.name), useValue: dayContentModel },
      ],
    }).compile();

    service = module.get<ProgramService>(ProgramService);
  });

  describe('startProgram', () => {
    it('should create new progress if none exists', async () => {
      progressModel.findOne.mockResolvedValue(null);
      progressModel.create.mockResolvedValue({ programStarted: true, currentDay: 1 });
      const result = await service.startProgram(userId);
      expect(result.programStarted).toBe(true);
    });

    it('should restart existing progress', async () => {
      const existing = { programStarted: false, save: jest.fn().mockResolvedValue({ programStarted: true }) };
      progressModel.findOne.mockResolvedValue(existing);
      const result = await service.startProgram(userId);
      expect(existing.programStarted).toBe(true);
    });
  });

  describe('completeDay', () => {
    it('should advance day and update completion', async () => {
      const progress = {
        currentDay: 5, completedLessons: [1, 2, 3, 4],
        completionPercentage: 0, streakCount: 0, lastActiveDate: new Date(),
        save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }),
      };
      progressModel.findOne.mockResolvedValue(progress);
      const result = await service.completeDay(userId);
      expect(progress.completedLessons).toContain(5);
      expect(progress.currentDay).toBe(6);
    });

    it('should cap at day 30', async () => {
      const progress = {
        currentDay: 30, completedLessons: Array.from({length: 29}, (_, i) => i + 1),
        completionPercentage: 0, streakCount: 0, lastActiveDate: new Date(),
        save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }),
      };
      progressModel.findOne.mockResolvedValue(progress);
      await service.completeDay(userId);
      expect(progress.currentDay).toBe(30);
    });

    it('should throw NotFoundException if progress not found', async () => {
      progressModel.findOne.mockResolvedValue(null);
      await expect(service.completeDay(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSummary', () => {
    it('should return summary data', async () => {
      progressModel.findOne.mockResolvedValue({
        currentDay: 5, completedLessons: [1, 2, 3, 4],
        completionPercentage: 13, streakCount: 4,
        startDate: new Date(), programStarted: true,
      });
      const result = await service.getSummary(userId);
      expect(result.currentDay).toBe(5);
      expect(result.completedLessons).toBe(4);
    });

    it('should throw NotFoundException if no progress', async () => {
      progressModel.findOne.mockResolvedValue(null);
      await expect(service.getSummary(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDayContent', () => {
    it('should return day content', async () => {
      dayContentModel.findOne.mockResolvedValue({ dayNumber: 1, title: 'Day 1' });
      const result = await service.getDayContent(1);
      expect(result.title).toBe('Day 1');
    });

    it('should throw NotFoundException if content not found', async () => {
      dayContentModel.findOne.mockResolvedValue(null);
      await expect(service.getDayContent(99)).rejects.toThrow(NotFoundException);
    });
  });
});
