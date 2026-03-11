import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClickEvent, ClickEventDocument } from './schemas/click-event.schema';
import {
  UserProgress,
  UserProgressDocument,
} from '../program/schemas/user-progress.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  Question,
  QuestionDocument,
} from '../questions/schemas/question.schema';
import {
  Testimonial,
  TestimonialDocument,
} from '../testimonials/schemas/testimonial.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(ClickEvent.name)
    private clickEventModel: Model<ClickEventDocument>,
    @InjectModel(UserProgress.name)
    private progressModel: Model<UserProgressDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Question.name)
    private questionModel: Model<QuestionDocument>,
    @InjectModel(Testimonial.name)
    private testimonialModel: Model<TestimonialDocument>,
  ) {}

  async trackClick(
    userId: string,
    data: { eventType: string; targetId?: string; targetUrl?: string; metadata?: any },
  ): Promise<ClickEventDocument> {
    return this.clickEventModel.create({
      userId: new Types.ObjectId(userId),
      ...data,
    });
  }

  async getDashboardStats() {
    const totalUsers = await this.userModel.countDocuments({
      isActive: true,
      role: 'user',
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const activeUsersThisWeek = await this.userModel.countDocuments({
      isActive: true,
      role: 'user',
      updatedAt: { $gte: weekAgo },
    });

    const completionStats = await this.progressModel.aggregate([
      {
        $group: {
          _id: null,
          avgCompletion: { $avg: '$completionPercentage' },
          totalStarted: { $sum: 1 },
        },
      },
    ]);

    const [pendingQuestions, pendingTestimonials, retreatVisits, productClicks] =
      await Promise.all([
        this.questionModel.countDocuments({ status: 'pending' }),
        this.testimonialModel.countDocuments({ status: 'pending' }),
        this.clickEventModel.countDocuments({ eventType: 'retreat_visit' }),
        this.clickEventModel.countDocuments({ eventType: 'product_click' }),
      ]);

    return {
      totalUsers,
      activeUsersThisWeek,
      avgCompletionPercentage: completionStats[0]?.avgCompletion || 0,
      totalStarted: completionStats[0]?.totalStarted || 0,
      pendingQuestions,
      pendingTestimonials,
      retreatVisits,
      productClicks,
      retreatInterestRate:
        totalUsers > 0 ? ((retreatVisits / totalUsers) * 100).toFixed(1) : 0,
      productClickRate:
        totalUsers > 0 ? ((productClicks / totalUsers) * 100).toFixed(1) : 0,
    };
  }

  async getCompletionRates(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

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

  async getDropoffHeatmap() {
    return this.progressModel.aggregate([
      { $match: { programStarted: true } },
      {
        $group: {
          _id: '$currentDay',
          stoppedHere: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getClickStats(startDate?: string, endDate?: string) {
    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    return this.clickEventModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async exportAnalyticsCsv() {
    const [users, progress, clicks] = await Promise.all([
      this.userModel
        .find({ isActive: true, role: 'user' })
        .select('name email createdAt'),
      this.progressModel.find(),
      this.clickEventModel.find().sort({ createdAt: -1 }).limit(1000),
    ]);

    // Build a CSV combining user data with progress
    const progressMap = new Map(
      progress.map((p) => [p.userId.toString(), p]),
    );

    const headers = [
      'Name',
      'Email',
      'Current Day',
      'Completion %',
      'Streak',
      'Registered',
    ];
    const rows = users.map((u) => {
      const prog = progressMap.get(u._id.toString());
      return [
        u.name,
        u.email,
        prog?.currentDay || 0,
        prog?.completionPercentage || 0,
        prog?.streakCount || 0,
        (u as any).createdAt,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
}
