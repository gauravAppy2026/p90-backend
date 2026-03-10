import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource, ResourceDocument } from './schemas/resource.schema';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(Resource.name)
    private resourceModel: Model<ResourceDocument>,
  ) {}

  async findActive(category?: string): Promise<ResourceDocument[]> {
    const filter: any = { isActive: true };
    if (category) filter.category = category;
    return this.resourceModel.find(filter).sort({ order: 1 });
  }

  async findAll(): Promise<ResourceDocument[]> {
    return this.resourceModel.find().sort({ order: 1 });
  }

  async create(data: Partial<Resource>): Promise<ResourceDocument> {
    return this.resourceModel.create(data);
  }

  async update(
    id: string,
    data: Partial<Resource>,
  ): Promise<ResourceDocument> {
    const resource = await this.resourceModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!resource) throw new NotFoundException('Resource not found');
    return resource;
  }

  async delete(id: string): Promise<void> {
    await this.resourceModel.findByIdAndDelete(id);
  }
}
