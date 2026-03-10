import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserProgress,
  UserProgressDocument,
} from './schemas/user-progress.schema';
import { DayContent, DayContentDocument } from './schemas/day-content.schema';

@Injectable()
export class ProgramService {
  constructor(
    @InjectModel(UserProgress.name)
    private progressModel: Model<UserProgressDocument>,
    @InjectModel(DayContent.name)
    private dayContentModel: Model<DayContentDocument>,
  ) {}

  // --- User Progress ---

  async getProgress(userId: string): Promise<UserProgressDocument | null> {
    return this.progressModel.findOne({ userId: new Types.ObjectId(userId) });
  }

  async startProgram(userId: string): Promise<UserProgressDocument> {
    const existing = await this.progressModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (existing) {
      existing.programStarted = true;
      existing.startDate = new Date();
      existing.lastActiveDate = new Date();
      return existing.save();
    }
    return this.progressModel.create({
      userId: new Types.ObjectId(userId),
      programStarted: true,
      startDate: new Date(),
      lastActiveDate: new Date(),
      currentDay: 1,
    });
  }

  async completeDay(userId: string): Promise<UserProgressDocument> {
    const progress = await this.progressModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!progress) throw new NotFoundException('Progress not found');

    const currentDay = progress.currentDay;
    if (!progress.completedLessons.includes(currentDay)) {
      progress.completedLessons.push(currentDay);
    }

    if (currentDay < 30) {
      progress.currentDay = currentDay + 1;
    }

    progress.completionPercentage = Math.round(
      (progress.completedLessons.length / 30) * 100,
    );
    progress.lastActiveDate = new Date();

    // Calculate streak
    const today = new Date();
    const lastActive = progress.lastActiveDate
      ? new Date(progress.lastActiveDate)
      : null;
    if (lastActive) {
      const diffDays = Math.floor(
        (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays <= 1) {
        progress.streakCount = (progress.streakCount || 0) + 1;
      } else {
        progress.streakCount = 1;
      }
    }

    return progress.save();
  }

  async getSummary(userId: string) {
    const progress = await this.progressModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!progress) throw new NotFoundException('Progress not found');

    return {
      currentDay: progress.currentDay,
      completedLessons: progress.completedLessons.length,
      completionPercentage: progress.completionPercentage,
      streakCount: progress.streakCount,
      startDate: progress.startDate,
      programStarted: progress.programStarted,
    };
  }

  // --- Day Content (Admin) ---

  async getDayContent(dayNumber: number): Promise<DayContentDocument> {
    const content = await this.dayContentModel.findOne({ dayNumber });
    if (!content)
      throw new NotFoundException(`Day ${dayNumber} content not found`);
    return content;
  }

  async getAllDayContent(): Promise<DayContentDocument[]> {
    return this.dayContentModel.find().sort({ dayNumber: 1 });
  }

  async createDayContent(data: Partial<DayContent>): Promise<DayContentDocument> {
    return this.dayContentModel.create(data);
  }

  async updateDayContent(
    dayNumber: number,
    data: Partial<DayContent>,
  ): Promise<DayContentDocument> {
    const content = await this.dayContentModel.findOneAndUpdate(
      { dayNumber },
      data,
      { new: true, upsert: true },
    );
    return content;
  }

  // --- Analytics helpers ---

  async getCompletionStats() {
    return this.progressModel.aggregate([
      {
        $group: {
          _id: null,
          avgCompletion: { $avg: '$completionPercentage' },
          totalStarted: { $sum: 1 },
          reachedDay15: {
            $sum: { $cond: [{ $gte: ['$currentDay', 15] }, 1, 0] },
          },
          completedDay30: {
            $sum: { $cond: [{ $gte: ['$currentDay', 30] }, 1, 0] },
          },
        },
      },
    ]);
  }

  async getDropoffData() {
    return this.progressModel.aggregate([
      { $match: { programStarted: true } },
      {
        $group: {
          _id: '$currentDay',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }
}
