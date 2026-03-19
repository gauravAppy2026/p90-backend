import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class TrackerService {
  constructor(
    @InjectModel(DailyTracker.name)
    private trackerModel: Model<DailyTrackerDocument>,
    @InjectModel(TrackerCategory.name)
    private categoryModel: Model<TrackerCategoryDocument>,
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
    return this.trackerModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), date: today },
      { ...data, userId: new Types.ObjectId(userId), date: today },
      { new: true, upsert: true },
    );
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
