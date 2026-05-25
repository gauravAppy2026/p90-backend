import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  NutritionContent,
  NutritionContentDocument,
  NutritionSection,
} from './schemas/nutrition-content.schema';
import { UpdateNutritionContentDto } from './dto/nutrition.dto';

// Seeded on first boot. Admin can edit titles, descriptions, images,
// activate/deactivate, and reorder — but the three section keys are
// fixed because the mobile screen renders them in dedicated slots.
const DEFAULT_SECTIONS: NutritionSection[] = [
  {
    key: 'livingFoods',
    title: 'Living Foods',
    description: 'Nourish your body with real food.',
    isActive: true,
    order: 1,
  },
  {
    key: 'hydration',
    title: 'Hydration',
    description: 'Water is your foundation.',
    isActive: true,
    order: 2,
  },
  {
    key: 'simpleGuidance',
    title: 'Simple Guidance',
    description: 'Keep it clean. Keep it simple.',
    isActive: true,
    order: 3,
  },
];

@Injectable()
export class NutritionService implements OnModuleInit {
  constructor(
    @InjectModel(NutritionContent.name)
    private readonly model: Model<NutritionContentDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.model.countDocuments();
    if (count === 0) {
      await this.model.create({ sections: DEFAULT_SECTIONS });
    }
  }

  async getContent(): Promise<NutritionContentDocument> {
    let doc = await this.model.findOne();
    if (!doc) doc = await this.model.create({ sections: DEFAULT_SECTIONS });
    return doc;
  }

  async updateContent(dto: UpdateNutritionContentDto): Promise<NutritionContentDocument> {
    const existing = await this.getContent();
    if (dto.headerTitle !== undefined) existing.headerTitle = dto.headerTitle;
    if (dto.headerSubtitle !== undefined) existing.headerSubtitle = dto.headerSubtitle;
    if (dto.sections) existing.sections = dto.sections as any;
    return existing.save();
  }
}
