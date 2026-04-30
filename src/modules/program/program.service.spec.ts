import { Test, TestingModule } from '@nestjs/testing';
import { ProgramService } from './program.service';
import { getModelToken } from '@nestjs/mongoose';
import { UserProgress } from './schemas/user-progress.schema';
import { DayContent } from './schemas/day-content.schema';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

const userId = new Types.ObjectId().toString();

describe('ProgramService', () => {
  let service: ProgramService;
  let progressModel: any;
  let dayContentModel: any;
  let subscriptions: any;

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
    subscriptions = {
      completeCurrentCycle: jest.fn().mockResolvedValue(undefined),
      startNewCycle: jest.fn().mockResolvedValue({ monthNumber: 2 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramService,
        { provide: getModelToken(UserProgress.name), useValue: progressModel },
        { provide: getModelToken(DayContent.name), useValue: dayContentModel },
        { provide: SubscriptionsService, useValue: subscriptions },
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

  describe('restartProgram', () => {
    const completedAll = () => ({
      currentMonth: 1,
      currentDay: 30,
      completedLessons: Array.from({ length: 30 }, (_, i) => i + 1),
      completionPercentage: 100,
      streakCount: 30,
      lastLessonCompletedDate: '2026-04-21',
      save: jest.fn(),
    });

    it('rejects when fewer than 30 days completed', async () => {
      progressModel.findOne.mockResolvedValue({
        completedLessons: [1, 2, 3],
      });
      await expect(service.restartProgram(userId)).rejects.toThrow(BadRequestException);
      expect(subscriptions.startNewCycle).not.toHaveBeenCalled();
    });

    it('rejects when no progress exists', async () => {
      progressModel.findOne.mockResolvedValue(null);
      await expect(service.restartProgram(userId)).rejects.toThrow(NotFoundException);
    });

    it('resets state and bumps the month cycle', async () => {
      const p = completedAll();
      p.save.mockImplementation(function (this: any) { return Promise.resolve(this); });
      progressModel.findOne.mockResolvedValue(p);

      await service.restartProgram(userId);

      expect(subscriptions.completeCurrentCycle).toHaveBeenCalledWith(userId);
      expect(subscriptions.startNewCycle).toHaveBeenCalledWith(userId, 2);
      expect(p.currentMonth).toBe(2);
      expect(p.currentDay).toBe(1);
      expect(p.completedLessons).toEqual([]);
      expect(p.completionPercentage).toBe(0);
      expect(p.streakCount).toBe(0);
      expect(p.lastLessonCompletedDate).toBe('');
      expect(p.save).toHaveBeenCalled();
    });

    it('supports unlimited restarts (Month 3, Month 4...)', async () => {
      const p = { ...completedAll(), currentMonth: 5 };
      p.save = jest.fn().mockImplementation(function (this: any) { return Promise.resolve(this); });
      progressModel.findOne.mockResolvedValue(p);

      await service.restartProgram(userId);
      expect(subscriptions.startNewCycle).toHaveBeenCalledWith(userId, 6);
      expect(p.currentMonth).toBe(6);
    });
  });
});
