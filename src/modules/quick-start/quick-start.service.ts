import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  QuickStartVideo,
  QuickStartVideoDocument,
} from './schemas/quick-start-video.schema';
import {
  CreateQuickStartVideoDto,
  UpdateQuickStartVideoDto,
} from './dto/quick-start.dto';

@Injectable()
export class QuickStartService {
  constructor(
    @InjectModel(QuickStartVideo.name)
    private readonly videoModel: Model<QuickStartVideoDocument>,
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
}
