import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DailyChecklist,
  DailyChecklistDocument,
} from './schemas/daily-checklist.schema';
import {
  ChecklistConfig,
  ChecklistConfigDocument,
} from './schemas/checklist-config.schema';
import { getLocalDate } from '../../common/utils/timezone.util';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class ChecklistService {
  constructor(
    @InjectModel(DailyChecklist.name)
    private checklistModel: Model<DailyChecklistDocument>,
    @InjectModel(ChecklistConfig.name)
    private configModel: Model<ChecklistConfigDocument>,
    @Optional() private gamification?: GamificationService,
  ) {}

  async getToday(userId: string, timezone?: string): Promise<DailyChecklistDocument | null> {
    const today = getLocalDate(timezone);
    return this.checklistModel.findOne({
      userId: new Types.ObjectId(userId),
      date: today,
    });
  }

  async updateToday(
    userId: string,
    data: { items?: any; dayNumber?: number },
    timezone?: string,
  ): Promise<DailyChecklistDocument> {
    const today = getLocalDate(timezone);
    const items = data.items || {};

    const completionCount = Object.values(items).filter(Boolean).length;
    const totalItems = await this.configModel.countDocuments({ isActive: true });

    const result = await this.checklistModel.findOneAndUpdate(
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

    // Award once per day when every active checklist item is ticked.
    if (this.gamification && totalItems > 0 && completionCount >= totalItems) {
      await this.gamification.award({
        userId,
        key: 'checklist_all_done',
        referenceId: `checklist:${today}`,
      });
    }

    return result;
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

  // --- Checklist Config (Admin) ---

  async getActiveConfig(): Promise<ChecklistConfigDocument[]> {
    return this.configModel.find({ isActive: true }).sort({ order: 1 });
  }

  async getAllConfig(): Promise<ChecklistConfigDocument[]> {
    return this.configModel.find().sort({ order: 1 });
  }

  async createConfig(data: Partial<ChecklistConfig>): Promise<ChecklistConfigDocument> {
    return this.configModel.create(data);
  }

  async updateConfig(id: string, data: Partial<ChecklistConfig>): Promise<ChecklistConfigDocument | null> {
    return this.configModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteConfig(id: string): Promise<void> {
    const config = await this.configModel.findByIdAndDelete(id);
    if (!config) throw new NotFoundException('Checklist item not found');
  }
}
