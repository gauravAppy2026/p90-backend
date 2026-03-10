import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DailyChecklist,
  DailyChecklistDocument,
} from './schemas/daily-checklist.schema';

@Injectable()
export class ChecklistService {
  constructor(
    @InjectModel(DailyChecklist.name)
    private checklistModel: Model<DailyChecklistDocument>,
  ) {}

  async getToday(userId: string): Promise<DailyChecklistDocument | null> {
    const today = new Date().toISOString().split('T')[0];
    return this.checklistModel.findOne({
      userId: new Types.ObjectId(userId),
      date: today,
    });
  }

  async updateToday(
    userId: string,
    data: { items?: any; dayNumber?: number },
  ): Promise<DailyChecklistDocument> {
    const today = new Date().toISOString().split('T')[0];
    const items = data.items || {};

    const completionCount = Object.values(items).filter(Boolean).length;

    return this.checklistModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), date: today },
      {
        userId: new Types.ObjectId(userId),
        date: today,
        dayNumber: data.dayNumber,
        items,
        completionCount,
      },
      { new: true, upsert: true },
    );
  }

  async getHistory(
    userId: string,
    limit = 30,
  ): Promise<DailyChecklistDocument[]> {
    return this.checklistModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ date: -1 })
      .limit(limit);
  }
}
