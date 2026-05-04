import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  QuickStartVideo,
  QuickStartVideoDocument,
} from './schemas/quick-start-video.schema';
import {
  QuickStartConfig,
  QuickStartConfigDocument,
} from './schemas/quick-start-config.schema';
import {
  CreateQuickStartVideoDto,
  UpdateQuickStartConfigDto,
  UpdateQuickStartVideoDto,
} from './dto/quick-start.dto';

@Injectable()
export class QuickStartService {
  constructor(
    @InjectModel(QuickStartVideo.name)
    private readonly videoModel: Model<QuickStartVideoDocument>,
    @InjectModel(QuickStartConfig.name)
    private readonly configModel: Model<QuickStartConfigDocument>,
  ) {}

  // Public — only active videos, ordered.
  async listActive(): Promise<QuickStartVideoDocument[]> {
    return this.videoModel.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
  }

  // Admin — all videos.
  async listAll(): Promise<QuickStartVideoDocument[]> {
    return this.videoModel.find().sort({ order: 1, createdAt: 1 });
  }

  async create(data: CreateQuickStartVideoDto): Promise<QuickStartVideoDocument> {
    return this.videoModel.create({ ...data, isActive: data.isActive ?? true });
  }

  async update(id: string, data: UpdateQuickStartVideoDto): Promise<QuickStartVideoDocument> {
    const updated = await this.videoModel.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new NotFoundException('Video not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.videoModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Video not found');
  }

  async getConfig(): Promise<QuickStartConfigDocument> {
    let doc = await this.configModel.findOne();
    if (!doc) doc = await this.configModel.create({});
    return doc;
  }

  async updateConfig(dto: UpdateQuickStartConfigDto): Promise<QuickStartConfigDocument> {
    const existing = await this.getConfig();
    if (dto.introText !== undefined) existing.introText = dto.introText;
    return existing.save();
  }
}
