import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RetreatSettings,
  RetreatSettingsDocument,
} from './schemas/retreat-settings.schema';

@Injectable()
export class RetreatService {
  constructor(
    @InjectModel(RetreatSettings.name)
    private retreatModel: Model<RetreatSettingsDocument>,
  ) {}

  async getSettings(): Promise<RetreatSettingsDocument | null> {
    // Singleton pattern - always get or create one document
    let settings = await this.retreatModel.findOne();
    if (!settings) {
      settings = await this.retreatModel.create({
        title: 'P90 Wellness Retreat',
        isActive: false,
      });
    }
    return settings;
  }

  async updateSettings(
    data: Partial<RetreatSettings>,
  ): Promise<RetreatSettingsDocument> {
    let settings = await this.retreatModel.findOne();
    if (!settings) {
      return this.retreatModel.create(data);
    }
    Object.assign(settings, data);
    return settings.save();
  }
}
