import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TrackerCategoryDocument = TrackerCategory & Document;

@Schema({ timestamps: true })
export class TrackerCategory {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: ['scale'], default: 'scale' })
  type: string;

  @Prop({ default: 0 })
  minValue: number;

  @Prop({ default: 10 })
  maxValue: number;

  @Prop()
  infoText: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order: number;
}

export const TrackerCategorySchema =
  SchemaFactory.createForClass(TrackerCategory);
