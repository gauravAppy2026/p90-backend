import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SplashConfig,
  SplashConfigDocument,
} from './schemas/splash-config.schema';
import { UpdateSplashConfigDto } from './dto/splash.dto';

const DEFAULT_MODULES: SplashConfig['modules'] = {
  quickStart: {
    title: 'Quick Start Guide',
    description:
      'Learn the basics of your device and get started with your first session.',
    badge: 'FREE',
    isActive: true,
  },
  thirtyDay: {
    title: 'The 30-Day Recharge',
    description:
      'Unlock this innovative companion program, designed to support you in your health journey. You will learn simple steps to take charge of your physical, mental and emotional well-being with daily actions, food suggestions and easy tracking tools.',
    badge: 'PREMIUM',
    moreInfoUrl: 'https://livingfoodmission.org/30-day-recharge',
    isActive: true,
  },
  allIn: {
    title: 'All-In Package',
    description:
      'Everything in the 30-Day Recharge plus private consultation, herbal protocol, weekly Zoom, and retreat discounts.',
    badge: 'ALL-IN',
    moreInfoUrl: 'https://livingfoodmission.org/services',
    isActive: true,
  },
};

@Injectable()
export class SplashService implements OnModuleInit {
  constructor(
    @InjectModel(SplashConfig.name) private readonly model: Model<SplashConfigDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.model.countDocuments();
    if (count === 0) {
      await this.model.create({ modules: DEFAULT_MODULES });
    }
  }

  async getConfig(): Promise<SplashConfigDocument> {
    let doc = await this.model.findOne();
    if (!doc) {
      doc = await this.model.create({ modules: DEFAULT_MODULES });
    }
    return doc;
  }

  async updateConfig(dto: UpdateSplashConfigDto): Promise<SplashConfigDocument> {
    const existing = await this.model.findOne();
    if (!existing) {
      return this.model.create({ ...dto, modules: dto.modules ?? DEFAULT_MODULES });
    }
    if (dto.appName !== undefined) existing.appName = dto.appName;
    if (dto.tagline !== undefined) existing.tagline = dto.tagline;
    if (dto.missionStatement !== undefined) existing.missionStatement = dto.missionStatement;
    if (dto.heroImageUrl !== undefined) existing.heroImageUrl = dto.heroImageUrl;
    if (dto.modules) {
      existing.modules = { ...existing.modules, ...dto.modules };
    }
    return existing.save();
  }
}
