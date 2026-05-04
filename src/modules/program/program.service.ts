import { Injectable, NotFoundException, ConflictException, BadRequestException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserProgress,
  UserProgressDocument,
} from './schemas/user-progress.schema';
import { DayContent, DayContentDocument } from './schemas/day-content.schema';
import { getLocalDate } from '../../common/utils/timezone.util';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class ProgramService {
  constructor(
    @InjectModel(UserProgress.name)
    private progressModel: Model<UserProgressDocument>,
    @InjectModel(DayContent.name)
    private dayContentModel: Model<DayContentDocument>,
    private subscriptions: SubscriptionsService,
    @Optional() private gamification?: GamificationService,
  ) {}

  // --- User Progress ---

  async getProgress(userId: string, timezone?: string) {
    const [progress, hasActivePurchase] = await Promise.all([
      this.progressModel.findOne({ userId: new Types.ObjectId(userId) }),
      this.subscriptions.hasActiveProgramAccess(userId),
    ]);

    // Even users with no progress doc yet get a `hasActivePurchase` so
    // the mobile dashboard can decide whether to show "Unlock" vs
    // "Start Program" without a second round trip.
    if (!progress) return { hasActivePurchase };

    const today = getLocalDate(timezone);
    const canCompleteLesson = progress.lastLessonCompletedDate !== today;

    return {
      ...progress.toObject(),
      canCompleteLesson,
      hasActivePurchase,
    };
  }

  async saveOnboarding(userId: string, data: {
    disclaimerAccepted?: boolean;
    counterIndicationsAccepted?: boolean;
    dataOptIn?: boolean;
    demographics?: any;
  }): Promise<UserProgressDocument> {
    const existing = await this.progressModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (existing) {
      if (data.disclaimerAccepted !== undefined) existing.disclaimerAccepted = data.disclaimerAccepted;
      if (data.counterIndicationsAccepted !== undefined) existing.counterIndicationsAccepted = data.counterIndicationsAccepted;
      if (data.dataOptIn !== undefined) existing.dataOptIn = data.dataOptIn;
      if (data.demographics) existing.demographics = data.demographics;
      return existing.save();
    }
    return this.progressModel.create({
      userId: new Types.ObjectId(userId),
      ...data,
      currentDay: 1,
    });
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

  async completeDay(userId: string, timezone?: string): Promise<UserProgressDocument> {
    const progress = await this.progressModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!progress) throw new NotFoundException('Progress not found');

    const today = getLocalDate(timezone);

    // One-lesson-per-day restriction
    if (progress.lastLessonCompletedDate === today) {
      throw new ConflictException(
        'You have already completed today\'s lesson. Next lesson available tomorrow.',
      );
    }

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
    progress.lastLessonCompletedDate = today;

    // Calculate streak
    const lastActive = progress.lastActiveDate
      ? new Date(progress.lastActiveDate)
      : null;
    if (lastActive) {
      const nowMs = new Date().getTime();
      const diffDays = Math.floor(
        (nowMs - lastActive.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays <= 1) {
        progress.streakCount = (progress.streakCount || 0) + 1;
      } else {
        progress.streakCount = 1;
      }
    }

    const saved = await progress.save();

    // Award tokens — referenceIds scope to the cycle so a Month 2 lesson
    // earns the same way a Month 1 lesson did, and streaks reset per cycle.
    if (this.gamification) {
      const cycle = saved.currentMonth ?? 1;
      await this.gamification.award({
        userId,
        key: 'lesson_complete',
        referenceId: `m${cycle}-lesson:${currentDay}`,
        monthCycle: cycle,
      });
      const streak = saved.streakCount;
      if (streak === 7) {
        await this.gamification.award({
          userId, key: 'streak_7_day',
          referenceId: `m${cycle}-streak7`, monthCycle: cycle,
        });
      } else if (streak === 14) {
        await this.gamification.award({
          userId, key: 'streak_14_day',
          referenceId: `m${cycle}-streak14`, monthCycle: cycle,
        });
      } else if (streak === 30) {
        await this.gamification.award({
          userId, key: 'streak_30_day',
          referenceId: `m${cycle}-streak30`, monthCycle: cycle,
        });
      }
      if (saved.completedLessons.length === 30) {
        await this.gamification.award({
          userId, key: 'program_complete',
          referenceId: `m${cycle}-complete`, monthCycle: cycle,
        });
      }
    }

    return saved;
  }

  async getSummary(userId: string) {
    const progress = await this.progressModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!progress) throw new NotFoundException('Progress not found');

    return {
      currentDay: progress.currentDay,
      currentMonth: progress.currentMonth ?? 1,
      completedLessons: progress.completedLessons.length,
      completionPercentage: progress.completionPercentage,
      streakCount: progress.streakCount,
      startDate: progress.startDate,
      programStarted: progress.programStarted,
      tokenBalance: progress.tokenBalance ?? 0,
    };
  }

  // Restart the 30-day program. Only allowed once the user has completed
  // all 30 days. Closes the current MonthCycle, opens a new one, and
  // resets day-level state (currentDay, completedLessons, streak,
  // completionPercentage). Demographics, consent, photos, and the
  // tracker history all persist across cycles — those are tied to the
  // user, not the cycle.
  async restartProgram(userId: string) {
    const progress = await this.progressModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!progress) throw new NotFoundException('Progress not found');
    if (progress.completedLessons.length < 30) {
      throw new BadRequestException(
        'You can only restart after completing all 30 days.',
      );
    }

    await this.subscriptions.completeCurrentCycle(userId);
    const nextMonth = (progress.currentMonth ?? 1) + 1;
    await this.subscriptions.startNewCycle(userId, nextMonth);

    progress.currentMonth = nextMonth;
    progress.currentDay = 1;
    progress.completedLessons = [];
    progress.completionPercentage = 0;
    progress.streakCount = 0;
    progress.lastLessonCompletedDate = '';
    progress.startDate = new Date();
    progress.lastActiveDate = new Date();
    return progress.save();
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
