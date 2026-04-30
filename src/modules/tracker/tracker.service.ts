import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DailyTracker,
  DailyTrackerDocument,
} from './schemas/daily-tracker.schema';
import {
  TrackerCategory,
  TrackerCategoryDocument,
} from './schemas/tracker-category.schema';
import { getLocalDate } from '../../common/utils/timezone.util';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class TrackerService {
  constructor(
    @InjectModel(DailyTracker.name)
    private trackerModel: Model<DailyTrackerDocument>,
    @InjectModel(TrackerCategory.name)
    private categoryModel: Model<TrackerCategoryDocument>,
    @Optional() private gamification?: GamificationService,
  ) {}

  async getToday(userId: string, timezone?: string): Promise<DailyTrackerDocument | null> {
    const today = getLocalDate(timezone);
    return this.trackerModel.findOne({
      userId: new Types.ObjectId(userId),
      date: today,
    });
  }

  async updateToday(
    userId: string,
    data: Partial<DailyTracker>,
    timezone?: string,
  ): Promise<DailyTrackerDocument> {
    const today = getLocalDate(timezone);
    const wasNew = !(await this.trackerModel.findOne({
      userId: new Types.ObjectId(userId),
      date: today,
    }));
    const result = await this.trackerModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), date: today },
      { ...data, userId: new Types.ObjectId(userId), date: today },
      { new: true, upsert: true },
    );
    if (this.gamification) {
      // Reward the first save of the day. The referenceId scopes the
      // award to today so saving multiple times in a day doesn't farm
      // duplicate tokens.
      if (wasNew) {
        await this.gamification.award({
          userId,
          key: 'tracker_entry',
          referenceId: `tracker:${today}`,
        });
      }
      // A photo URL on the entry awards photo tokens once per day.
      if (data?.photoUrl) {
        await this.gamification.award({
          userId,
          key: 'progress_photo',
          referenceId: `photo:${today}`,
        });
      }
    }
    return result;
  }

  async getHistory(
    userId: string,
    limit = 30,
  ): Promise<DailyTrackerDocument[]> {
    return this.trackerModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ date: -1 })
      .limit(limit);
  }

  // --- Tracker Categories (Admin) ---

  async getActiveCategories(): Promise<TrackerCategoryDocument[]> {
    return this.categoryModel
      .find({ isActive: true })
      .sort({ order: 1 });
  }

  async getAllCategories(): Promise<TrackerCategoryDocument[]> {
    return this.categoryModel.find().sort({ order: 1 });
  }

  async createCategory(
    data: Partial<TrackerCategory>,
  ): Promise<TrackerCategoryDocument> {
    return this.categoryModel.create(data);
  }

  async updateCategory(
    id: string,
    data: Partial<TrackerCategory>,
  ): Promise<TrackerCategoryDocument | null> {
    return this.categoryModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoryModel.findByIdAndDelete(id);
    if (!category) throw new NotFoundException('Category not found');
  }
}
