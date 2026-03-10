import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ResourceDocument = Resource & Document;

export enum ResourceType {
  BOOK = 'book',
  ARTICLE = 'article',
  VIDEO = 'video',
  COURSE = 'course',
}

export enum ResourceCategory {
  LEARNING = 'learning',
  WELLNESS = 'wellness',
  DEVICES = 'devices',
  NUTRITION = 'nutrition',
  MINDFULNESS = 'mindfulness',
}

@Schema({ timestamps: true })
export class Resource {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  url: string;

  @Prop({ type: String, enum: ResourceType, required: true })
  type: ResourceType;

  @Prop({ type: String, enum: ResourceCategory, required: true })
  category: ResourceCategory;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
