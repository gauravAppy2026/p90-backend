import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NutritionContentDocument = NutritionContent & Document;

// Each section card on the mobile Nutrition screen. Three sections
// seeded by default — Living Foods, Hydration, Simple Guidance —
// matching Lara's May 25 design board. Admin can edit any field
// but the keys stay fixed so mobile knows where to render which.
export interface NutritionSection {
  key: 'livingFoods' | 'hydration' | 'simpleGuidance';
  title: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  order: number;
}

// Singleton — one nutrition-content doc per environment.
@Schema({ timestamps: true })
export class NutritionContent {
  @Prop({ maxlength: 200, default: 'Fuel your cells. Elevate your energy.' })
  headerTitle: string;

  @Prop({ maxlength: 500, default: '' })
  headerSubtitle: string;

  @Prop({ type: Array, default: () => [] })
  sections: NutritionSection[];
}

export const NutritionContentSchema = SchemaFactory.createForClass(NutritionContent);
